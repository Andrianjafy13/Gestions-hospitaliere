// server.js
import express    from "express";
import cors       from "cors";
import http       from "http";
import { Server } from "socket.io";
import sequelize  from "./config/database.js";
import path       from "path";
import jwt        from "jsonwebtoken"; // ← AJOUT
import constants  from "./config/constants.js"; // ← AJOUT

import authRoutes    from "./routes/authRoutes.js";
import insertRoutes  from "./routes/insertRoutes.js";
import routeGet      from "./routes/routeGet.js";
import routePut      from "./routes/routePut.js";
import routeDelete   from "./routes/routeDelete.js";
import publicRoutes   from "./routes/publicRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message       from "./models/Message.js";
import { initIO }    from "./socket.js";
import { demarrerCronExpiration } from "./jobs/expirationCron.js";
import roomRoutes    from "./routes/room.js";


const app = express();

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ── HTTP + SOCKET ── */
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET","POST"] },
});

/* ── Routes ── */
app.use("/api/auth",      authRoutes);
app.use("/api/insertion", insertRoutes);
app.use("/api/GET",       routeGet);
app.use("/api/PUT",       routePut);
app.use("/api/DELETE",    routeDelete);
app.use("/api/message",   messageRoutes);
app.use("/api/rooms",     roomRoutes);
app.use("/api/public", publicRoutes);

/* ── Map userId → socketId ── */
const utilisateursConnectes = {};

// ════════════════════════════════════════════════════════════
// ← AJOUT : Map dédiée pour les utilisateurs vidéo connectés
// Séparée de utilisateursConnectes pour ne pas interférer
// ════════════════════════════════════════════════════════════
const videoUsers = new Map(); // userId (string) → socketId

/* ── Socket ── */
io.on("connection", (socket) => {
  console.log("Socket connecté:", socket.id);

  // ✅ Enregistrement dans la room privée de l'utilisateur
  socket.on("rejoindre", (userId) => {
    const uid = parseInt(userId);
    socket.join(`user_${uid}`);
    utilisateursConnectes[uid] = socket.id;
    console.log(`User ${uid} → room user_${uid}`);

    // ← AJOUT : enregistrer aussi dans videoUsers pour les appels vidéo
    videoUsers.set(String(uid), socket.id);
  });

  // ✅ Envoi message — room privée expéditeur + destinataire uniquement
  socket.on("envoyerMessage", async ({ expediteurId, destinataireId, contenu }) => {
    try {
      const expId  = parseInt(expediteurId);
      const destId = parseInt(destinataireId);

      if (!expId || !destId || !contenu?.trim()) return;

      const message = await Message.create({
        expediteurId:   expId,
        destinataireId: destId,
        contenu:        contenu.trim(),
        lu:             false,
      });

      const messageComplet = {
        id:             message.id,
        contenu:        message.contenu,
        expediteurId:   expId,
        destinataireId: destId,
        createdAt:      message.createdAt,
        lu:             false,
        modifie:        false,
        supprime:       false,
      };

      io.to(`user_${destId}`).emit("nouveauMessage", messageComplet);
      io.to(`user_${expId}`).emit("messageEnvoye", messageComplet);

    } catch (error) {
      console.error("Erreur envoyerMessage:", error);
      socket.emit("erreurMessage", { message: "Erreur envoi" });
    }
  });

  // ✅ Modifier message
  socket.on("modifier_message", async ({ messageId, contenu, expediteurId }) => {
    try {
      const expId   = parseInt(expediteurId);
      const message = await Message.findByPk(messageId);

      if (!message) {
        socket.emit("erreurMessage", { message: "Message introuvable." });
        return;
      }
      if (message.expediteurId !== expId) {
        socket.emit("erreurMessage", { message: "Action non autorisée." });
        return;
      }

      message.contenu = contenu.trim();
      message.modifie = true;
      await message.save();

      const payload = {
        messageId,
        contenu:   message.contenu,
        modifie:   true,
        updatedAt: message.updatedAt,
      };

      io.to(`user_${message.expediteurId}`).emit("message_modifie", payload);
      io.to(`user_${message.destinataireId}`).emit("message_modifie", payload);

    } catch (err) {
      console.error("modifier_message:", err);
      socket.emit("erreurMessage", { message: "Erreur modification." });
    }
  });

  // ✅ Supprimer message
  socket.on("supprimer_message", async ({ messageId, expediteurId }) => {
    try {
      const expId   = parseInt(expediteurId);
      const message = await Message.findByPk(messageId);

      if (!message) {
        socket.emit("erreurMessage", { message: "Message introuvable." });
        return;
      }
      if (message.expediteurId !== expId) {
        socket.emit("erreurMessage", { message: "Action non autorisée." });
        return;
      }

      message.supprime = true;
      message.contenu  = "Ce message a été supprimé.";
      await message.save();

      const payload = { messageId };

      io.to(`user_${message.expediteurId}`).emit("message_supprime", payload);
      io.to(`user_${message.destinataireId}`).emit("message_supprime", payload);

    } catch (err) {
      console.error("supprimer_message:", err);
      socket.emit("erreurMessage", { message: "Erreur suppression." });
    }
  });

  // ✅ Indicateur écriture
  socket.on("enTrainDEcrire", ({ expediteurId, destinataireId }) => {
    io.to(`user_${parseInt(destinataireId)}`).emit("utilisateurEcrit", {
      expediteurId: parseInt(expediteurId),
    });
  });

  // ════════════════════════════════════════════════════════════
  // ← AJOUT BLOC COMPLET : Signalisation WebRTC vidéo
  // ════════════════════════════════════════════════════════════

  // ── Médecin appelle un patient ────────────────────────────
  // Payload : { patientId, numeroChambre, offer (SDP), medecinNom }
  socket.on("call:initiate", ({ patientId, numeroChambre, offer, medecinNom }) => {
    const patientSocketId = videoUsers.get(String(patientId));

    console.log(`📹 Appel vers patient ${patientId} | socket: ${patientSocketId || "non connecté"}`);

    if (!patientSocketId) {
      socket.emit("call:error", {
        error:   "PATIENT_OFFLINE",
        message: "Le patient n'est pas connecté."
      });
      return;
    }

    io.to(patientSocketId).emit("call:incoming", {
      medecinId:     socket.id,         // socketId du médecin pour répondre
      medecinUserId: socket.medecinId,  // userId réel (si besoin)
      medecinNom,
      numeroChambre,
      offer
    });
  });

  // ── Patient accepte l'appel ───────────────────────────────
  // Payload : { medecinId (socketId), answer (SDP) }
  socket.on("call:accept", ({ medecinId, answer }) => {
    console.log(`✅ Patient accepte — médecin socket: ${medecinId}`);

    io.to(medecinId).emit("call:accepted", {
      patientId: socket.id,
      answer
    });
  });

  // ── Patient refuse l'appel ────────────────────────────────
  // Payload : { medecinId (socketId) }
  socket.on("call:decline", ({ medecinId }) => {
    console.log(`❌ Patient refuse — médecin socket: ${medecinId}`);

    io.to(medecinId).emit("call:declined", {
      message: "Le patient a refusé l'appel."
    });
  });

  // ── Échange ICE candidates (WebRTC) ──────────────────────
  // Payload : { targetSocketId, candidate }
  socket.on("ice:candidate", ({ targetSocketId, candidate }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice:candidate", {
        from:      socket.id,
        candidate
      });
    }
  });

  // ── Fin d'appel ───────────────────────────────────────────
  // Payload : { targetSocketId }
  socket.on("call:end", ({ targetSocketId }) => {
    console.log(`📵 Fin appel — de ${socket.id} vers ${targetSocketId}`);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:ended", {
        from: socket.id
      });
    }
  });

  // ════════════════════════════════════════════════════════════
  // FIN AJOUT WebRTC
  // ════════════════════════════════════════════════════════════

  // ✅ Nettoyage à la déconnexion
  socket.on("disconnect", () => {
    const userId = Object.keys(utilisateursConnectes)
      .find(id => utilisateursConnectes[id] === socket.id);
    if (userId) {
      delete utilisateursConnectes[userId];
      // ← AJOUT : nettoyer aussi videoUsers
      videoUsers.delete(String(userId));
      console.log(`User ${userId} déconnecté`);
    }
  });

  initIO(io);

  socket.on("rejoindre_pharmacie", () => {
    socket.join("pharmacie");
    console.log(`Socket ${socket.id} → room pharmacie`);
  });
});

/* ── Base de données + démarrage ── */
try {
  await sequelize.sync({ alter: true });
  console.log("Base de données synchronisée");
  demarrerCronExpiration();

  server.listen(5000, () => {
    console.log("Serveur démarré sur http://localhost:5000");
  });
} catch (error) {
  console.error("Erreur démarrage serveur:", error);
  process.exit(1);
}
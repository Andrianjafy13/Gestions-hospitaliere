// server.js
import express    from "express";
import cors       from "cors";
import http       from "http";
import { Server } from "socket.io";
import sequelize  from "./config/database.js";
import path       from "path";

import authRoutes    from "./routes/authRoutes.js";
import insertRoutes  from "./routes/insertRoutes.js";
import routeGet      from "./routes/routeGet.js";
import routePut      from "./routes/routePut.js";
import routeDelete   from "./routes/routeDelete.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message       from "./models/Message.js";
import { initIO } from "./socket.js";
import { demarrerCronExpiration } from "./jobs/expirationCron.js";

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



/* ── Map userId → socketId ── */
const utilisateursConnectes = {};

/* ── Socket ── */
io.on("connection", (socket) => {
  console.log("Socket connecté:", socket.id);

  // ✅ Enregistrement dans la room privée de l'utilisateur
  socket.on("rejoindre", (userId) => {
    const uid = parseInt(userId);
    socket.join(`user_${uid}`);
    utilisateursConnectes[uid] = socket.id;
    console.log(`User ${uid} → room user_${uid}`);
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

      // ✅ Seulement au destinataire dans SA room privée
      io.to(`user_${destId}`).emit("nouveauMessage", messageComplet);

      // ✅ Confirmation à l'expéditeur dans SA room privée
      io.to(`user_${expId}`).emit("messageEnvoye", messageComplet);

    } catch (error) {
      console.error("Erreur envoyerMessage:", error);
      socket.emit("erreurMessage", { message: "Erreur envoi" });
    }
  });

  // ✅ Modifier message — notifier expéditeur ET destinataire via leurs rooms privées
  // Correction : suppression de conversationId — on utilise les ids depuis la BDD
  socket.on("modifier_message", async ({ messageId, contenu, expediteurId }) => {
    try {
      const expId   = parseInt(expediteurId);
      const message = await Message.findByPk(messageId);

      // Sécurité — message inexistant ou pas l'auteur
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

      // ✅ Notifier les deux participants via leurs rooms privées
      io.to(`user_${message.expediteurId}`).emit("message_modifie", payload);
      io.to(`user_${message.destinataireId}`).emit("message_modifie", payload);

    } catch (err) {
      console.error("modifier_message:", err);
      socket.emit("erreurMessage", { message: "Erreur modification." });
    }
  });

  // ✅ Supprimer message — notifier expéditeur ET destinataire via leurs rooms privées
  // Correction : suppression de conversationId — on utilise les ids depuis la BDD
  socket.on("supprimer_message", async ({ messageId, expediteurId }) => {
    try {
      const expId   = parseInt(expediteurId);
      const message = await Message.findByPk(messageId);

      // Sécurité — message inexistant ou pas l'auteur
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

      // ✅ Notifier les deux participants via leurs rooms privées
      io.to(`user_${message.expediteurId}`).emit("message_supprime", payload);
      io.to(`user_${message.destinataireId}`).emit("message_supprime", payload);

    } catch (err) {
      console.error("supprimer_message:", err);
      socket.emit("erreurMessage", { message: "Erreur suppression." });
    }
  });

  // ✅ Indicateur écriture — seulement au destinataire
  socket.on("enTrainDEcrire", ({ expediteurId, destinataireId }) => {
    io.to(`user_${parseInt(destinataireId)}`).emit("utilisateurEcrit", {
      expediteurId: parseInt(expediteurId),
    });
  });


  // ✅ Nettoyage à la déconnexion
  socket.on("disconnect", () => {
    const userId = Object.keys(utilisateursConnectes)
      .find(id => utilisateursConnectes[id] === socket.id);
    if (userId) {
      delete utilisateursConnectes[userId];
      console.log(`User ${userId} déconnecté`);
    }
  });

  initIO(io);   // ← ajouter juste après

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
import express from "express";
import cors    from "cors";
import http    from "http";
import { Server } from "socket.io";
import sequelize  from "./config/database.js";

import authRoutes    from "./routes/authRoutes.js";
import insertRoutes  from "./routes/insertRoutes.js";
import routeGet      from "./routes/routeGet.js";
import routePut      from "./routes/routePut.js";
import routeDelete   from "./routes/routeDelete.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/Message.js";
import path from "path";

const app = express();

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ── HTTP + SOCKET ── */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:  "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* ── Routes ── */
app.use("/api/auth",      authRoutes);
app.use("/api/insertion", insertRoutes);
app.use("/api/GET",       routeGet);
app.use("/api/PUT",       routePut);
app.use("/api/DELETE",    routeDelete);
app.use("/api/message",   messageRoutes);

/* ── Socket ── */
const utilisateursConnectes = {};

io.on("connection", (socket) => {

  socket.on("rejoindre", (userId) => {
    socket.join(`user_${userId}`);
    utilisateursConnectes[userId] = socket.id;
    console.log(`User ${userId} connecté — room: user_${userId}`);
  });

  // ✅ Modifier un message
  socket.on("modifier_message", async ({ messageId, contenu, expediteurId, conversationId }) => {
    try {
      const message = await Message.findByPk(messageId);
      if (!message || message.expediteurId !== expediteurId) return;

      message.contenu = contenu.trim();
      message.modifie = true;
      await message.save();

      io.to(conversationId).emit("message_modifie", {
        messageId,
        contenu:   message.contenu,
        modifie:   true,
        updatedAt: message.updatedAt,
      });
    } catch (err) {
      console.error("modifier_message socket:", err);
    }
  });

  // ✅ Supprimer un message
  socket.on("supprimer_message", async ({ messageId, expediteurId, conversationId }) => {
    try {
      const message = await Message.findByPk(messageId);
      if (!message || message.expediteurId !== expediteurId) return;

      message.supprime = true;
      message.contenu  = "Ce message a été supprimé.";
      await message.save();

      io.to(conversationId).emit("message_supprime", { messageId });
    } catch (err) {
      console.error("supprimer_message socket:", err);
    }
  });

  // ✅ Envoyer un message
  socket.on("envoyerMessage", async ({ expediteurId, destinataireId, contenu }) => {
    try {
      if (!expediteurId || !destinataireId || !contenu?.trim()) return;

      const message = await Message.create({
        expediteurId,
        destinataireId,
        contenu: contenu.trim(),
        lu:      false,
      });

      const messageComplet = {
        id:             message.id,
        contenu:        message.contenu,
        expediteurId:   parseInt(expediteurId),
        destinataireId: parseInt(destinataireId),
        createdAt:      message.createdAt,
        lu:             false,
      };

      io.to(`user_${destinataireId}`).emit("nouveauMessage",  messageComplet);
      io.to(`user_${expediteurId}`).emit("messageEnvoye",     messageComplet);

    } catch (error) {
      console.error("Erreur socket envoyerMessage:", error);
      socket.emit("erreurMessage", { message: "Erreur envoi" });
    }
  });

  socket.on("enTrainDEcrire", ({ expediteurId, destinataireId }) => {
    io.to(`user_${destinataireId}`).emit("utilisateurEcrit", { expediteurId });
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(utilisateursConnectes)
      .find(id => utilisateursConnectes[id] === socket.id);
    if (userId) delete utilisateursConnectes[userId];
  });
});

/* ── Base de données + démarrage serveur ── */
// ✅ Correction — await seul OU .then() seul, pas les deux mélangés
try {
  // ✅ alter: true — ajoute les colonnes manquantes (receptionnisteId etc.)
  // sans supprimer les données existantes
  await sequelize.sync({ alter: true });
  console.log("✅ Base de données synchronisée");

  server.listen(5000, () => {
    console.log("🚀 Serveur démarré sur http://localhost:5000");
  });

} catch (error) {
  console.error("❌ Erreur démarrage serveur :", error);
  process.exit(1);
}
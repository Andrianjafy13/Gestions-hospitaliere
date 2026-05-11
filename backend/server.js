import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import sequelize from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import insertRoutes from "./routes/insertRoutes.js";
import routeGet from "./routes/routeGet.js";
import routePut from "./routes/routePut.js";
import routeDelete from "./routes/routeDelete.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/Message.js";

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

/* HTTP + SOCKET */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/insertion", insertRoutes);
app.use("/api/GET", routeGet);
app.use("/api/PUT", routePut);
app.use("/api/DELETE", routeDelete);
app.use("/api/message", messageRoutes);

/* SOCKET USERS */
const utilisateursConnectes = {};

/* SOCKET */
// ✅ Correction majeure — envoyer UNIQUEMENT au destinataire
io.on("connection", (socket) => {

  socket.on("rejoindre", (userId) => {
    // ✅ Chaque utilisateur rejoint SA room privée
    socket.join(`user_${userId}`); // ✅ room privée par userId
    utilisateursConnectes[userId] = socket.id;
    console.log(`User ${userId} connecté — room: user_${userId}`);
  });

  // ✅ Modifier un message — diffuser à tous
  socket.on("modifier_message", async ({ messageId, contenu, expediteurId, conversationId }) => {
    try {
      const message = await Message.findByPk(messageId);
      if (!message || message.expediteurId !== expediteurId) return;

      message.contenu = contenu.trim();
      message.modifie = true;
      await message.save();

      // Diffuser la modification à tous les participants
      io.to(conversationId).emit("message_modifie", {
        messageId,
        contenu:  message.contenu,
        modifie:  true,
        updatedAt: message.updatedAt,
      });
    } catch (err) {
      console.error("modifier_message socket:", err);
    }
  });

  // ✅ Supprimer un message — diffuser à tous
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


  socket.on("envoyerMessage", async ({ expediteurId, destinataireId, contenu }) => {
    try {
      if (!expediteurId || !destinataireId || !contenu?.trim()) return;

      // ✅ Sauvegarder en base
      const message = await Message.create({
        expediteurId,
        destinataireId,
        contenu: contenu.trim(),
        lu: false,
      });

      const messageComplet = {
        id:            message.id,
        contenu:       message.contenu,
        expediteurId:  parseInt(expediteurId),
        destinataireId: parseInt(destinataireId),
        createdAt:     message.createdAt,
        lu:            false,
      };

      // ✅ Envoyer UNIQUEMENT dans la room privée du destinataire
      // Personne d'autre ne reçoit ce message
      io.to(`user_${destinataireId}`).emit("nouveauMessage", messageComplet);

      // ✅ Confirmer à l'expéditeur dans SA room
      io.to(`user_${expediteurId}`).emit("messageEnvoye", messageComplet);

    } catch (error) {
      console.error("Erreur socket envoyerMessage:", error);
      socket.emit("erreurMessage", { message: "Erreur envoi" });
    }
  });

  socket.on("enTrainDEcrire", ({ expediteurId, destinataireId }) => {
    // ✅ Envoyer uniquement au destinataire concerné
    io.to(`user_${destinataireId}`).emit("utilisateurEcrit", { expediteurId });
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(utilisateursConnectes)
      .find(id => utilisateursConnectes[id] === socket.id);
    if (userId) {
      delete utilisateursConnectes[userId];
    }
  });
});

/* DATABASE */
sequelize.sync() // ❌ PAS alter:true
  .then(() => console.log("✅ DB synchronisée"))
  .catch(console.error);

/* SERVER */
server.listen(5000, () => {
  console.log("🚀 Server sur http://localhost:5000");
});
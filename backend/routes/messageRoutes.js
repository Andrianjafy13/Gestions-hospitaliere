// routes/messageRoutes.js
import express from "express";
import {
  getMedecin,
  getConversation,
  getNonLus,
  getConversations,
  modifierMessage,
  supprimerMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/utilisateurs/:userId",              getMedecin);       // tous sauf soi
router.get("/conversations/:userId",             getConversations);
router.get("/conversation/:userId/:autreUserId", getConversation);
router.get("/non-lus/:userId",                   getNonLus);
router.put( "/put/message/:id", modifierMessage);
router.delete("/DELETE/message/:id", supprimerMessage);

export default router;
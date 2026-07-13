import express from "express";

import {
  getStatsPublic,
  getAnnuaire,
  getProfessionnelById,
  callProfessionnel,
  envoyerMessageReceptionniste,
} from "../controllers/publicController.js";

const router = express.Router();

/**
 * Dashboard
 */
router.get("/statsPublic", getStatsPublic);

/**
 * Annuaire
 */
router.get("/annuaire", getAnnuaire);

router.get("/annuaire/:id", getProfessionnelById);

/**
 * Appel
 */
router.post("/annuaire/:id/call", callProfessionnel);
router.post("/annuaire/:id/message", envoyerMessageReceptionniste);

export default router;

// routes/analyseRoutes.js
import express from "express";
import {
  creerAnalyseScan,
  getAnalyses,
  getAnalyseById,
  validerAnalyse,
  getSuiviAvecAnalyses,
} from "../controllers/analyseController.js";

const router = express.Router();

// ─── Endpoint Flutter → reçoit les données de scan ───────────────────────
// POST http://localhost:5000/api/analyses/scan
router.post("/analyses/scan", creerAnalyseScan);

// ─── Endpoints React → affichage et gestion ──────────────────────────────
// GET  http://localhost:5000/api/analyses
router.get("/analyses", getAnalyses);

// GET  http://localhost:5000/api/analyses/:id
router.get("/analyses/:id", getAnalyseById);

// PATCH http://localhost:5000/api/analyses/:id/valider
router.patch("/analyses/:id/valider", validerAnalyse);

// GET  http://localhost:5000/api/analyses/patient/:patientId
// (Analyses Flutter d'un patient — utilisé par AjoutSuivi.jsx)
router.get("/analyses/patient/:patientId", getSuiviAvecAnalyses);

export default router;

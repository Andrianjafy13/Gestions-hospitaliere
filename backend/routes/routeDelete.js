// routes/deleteRoutes.js
import express from "express";
import { supprimerArcive, supprimerConsultation, supprimerGarde, supprimerMedicament, supprimerPatient, supprimerRendezVous, suprimerOrdonance } from "../controllers/DeleteController.js";

const router = express.Router();

router.delete("/patient/:id",      supprimerPatient);
router.delete("/rendezVous/:id",   supprimerRendezVous);
router.delete("/garde/:id",        supprimerGarde);
router.delete("/medicament/:id",   supprimerMedicament);
router.delete("/consultation/:id", supprimerConsultation);
router.delete("/notifications/pharmacie/:id", suprimerOrdonance);
router.delete("/archive/:id", supprimerArcive);

export default router;
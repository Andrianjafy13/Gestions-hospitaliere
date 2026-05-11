// routes/deleteRoutes.js
import express from "express";
import { supprimerConsultation, supprimerGarde, supprimerMedicament, supprimerPatient, supprimerRendezVous } from "../controllers/DeleteController.js";

const router = express.Router();

router.delete("/patient/:id",      supprimerPatient);
router.delete("/rendezVous/:id",   supprimerRendezVous);
router.delete("/garde/:id",        supprimerGarde);
router.delete("/medicament/:id",   supprimerMedicament);
router.delete("/consultation/:id", supprimerConsultation);

export default router;
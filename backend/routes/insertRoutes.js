import express from "express";
import { CreationConsultation, ajoutChambre, ajoutMedecament, ajouterSuivi, creerGarde, patients, rendezVous } from "../controllers/codeController.js";

const router = express.Router();

router.post("/AjoutPatients", patients);
router.post("/CreationConsultation", CreationConsultation);
router.post("/rendez-vous", rendezVous)
router.post("/Ajouter-Garde", creerGarde)
router.post("/ajout-medicament", ajoutMedecament)
router.post("/ajout-Chambre", ajoutChambre)
router.post("/suivi", ajouterSuivi);

export default router;
import express from "express";
import { getChambresDisponibles, getChartData, getConsultations, getCountMedicament, getGardes, getInfirmerie, getListePatients, getListeRendezVous, getMedecin, getMedicaments, getNonVusPharmacien, getOrdonnancesPharmacien, getPatientHospitalise, getPatients, getPatientsHospitalises, getRendezVousMedecin, getStats, getStatsMensuelles, getSuivisPatient } from "../controllers/getCotroller.js";
import { getNonVus, marquerVus } from "../controllers/codeController.js";

const router = express.Router();

router.get("/Liste_patients/:medecinId", getListePatients);
router.get("/allPatients", getPatients);
router.get("/allMedecin", getMedecin);
router.get("/AllConsultations/:medecinId", getConsultations);
router.get("/stats/:medecinId",getStats);
router.get("/chart/:medecinId",getChartData);
router.get("/stats-mensuelles/:medecinId", getStatsMensuelles)
router.get("/rendez-vous/non-vus/:medecinId",  getNonVus);
router.get("/rendez-vous/:medecinId", getRendezVousMedecin);
router.get("/allRendez-vous", getListeRendezVous);
router.get("/allInfirmier", getInfirmerie);
router.get("/gardes", getGardes);
router.get("/medicaments", getMedicaments)
router.get("/notifications/pharmacie/non-vus",   getNonVusPharmacien);
router.get("/notifications/pharmacie/ordonnances", getOrdonnancesPharmacien);
router.get("/chambres-disponibles", getChambresDisponibles)
router.get("/hospitalise", getPatientHospitalise)
router.get("/AllHospitalise", getPatientsHospitalises)
router.get("/suivi/:patientId", getSuivisPatient)
router.get("/totalMedicament", getCountMedicament);

export default router;

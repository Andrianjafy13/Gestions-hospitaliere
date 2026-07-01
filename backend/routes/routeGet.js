import express from "express";
import { getChambresDisponibles, getChartData, getCommandesRecentes, getCommandesRecentess, getConsultations, getCountMedicament, getGardes, getInfirmerie, getListePatients, getListePatientsReceptionniste, getListeRendezVous, getMedecin, getMedicamentExpire, getMedicaments, getNonVusPharmacien, getOrdonnancesPharmacien, getPatientHospitalise, getPatients, getPatientsHospitalises, getProchainRdv, getRendezVousMedecin, getStats, getStatsMensuelles, getStatsOrdonnances, getStatsOrdonnancess, getStatsPatientsAssignesJour, getStatsReceptionniste, getSuivisPatient, getUsersByRole } from "../controllers/getCotroller.js";
import { getNonVus, marquerVus } from "../controllers/codeController.js";
import { getProfil } from "../controllers/profilController.js";

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
router.get("/medicaments/expires", getMedicamentExpire);
router.get("/notifications/pharmacie/non-vus",   getNonVusPharmacien);
router.get("/notifications/pharmacie/ordonnances", getOrdonnancesPharmacien);
router.get("/chambres-disponibles", getChambresDisponibles)
router.get("/hospitalise", getPatientHospitalise)
router.get("/AllHospitalise", getPatientsHospitalises)
router.get("/suivi/:patientId", getSuivisPatient)
router.get("/infirmerie/stats-patients-jour", getStatsPatientsAssignesJour)
router.get("/totalMedicament", getCountMedicament);
router.get("/pharmacie/stats-ordonnances",  getStatsOrdonnancess);
router.get("/pharmacie/commandes-recentes", getCommandesRecentess);
router.get("/receptionniste/stats/:receptionnisteId",       getStatsReceptionniste);
router.get("/receptionniste/prochains-rdv", getProchainRdv);
router.get("/receptionniste/patients/:receptionnisteId", getListePatientsReceptionniste);
router.get("/profil/:userId",        getProfil);
router.get("/public", getUsersByRole);


export default router;

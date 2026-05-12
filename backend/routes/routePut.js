import express from "express";
import { marquerDelivree, marquerVusPharmacien } from "../controllers/getCotroller.js";
import { libererChambre, modifierConsultation, modifierGarde, modifierMedicament, modifierPatient, modifierRendezVous, updateStatutRendezVous } from "../controllers/UpdateController.js";
import { marquerVus } from "../controllers/codeController.js";
import { updatePhotoProfil, upload } from "../controllers/profilController.js";

const router = express.Router();

router.put("/rendez-vous/marquer-vus/:medecinId", marquerVus);
router.put("/notifications/pharmacie/marquer-vus", marquerVusPharmacien);
router.put("/notifications/pharmacie/:id/delivree", marquerDelivree);
router.put("/patient/:id",      modifierPatient);
router.put("/rendezVous/:id",   modifierRendezVous);
router.put("/garde/:id",        modifierGarde);
router.put("/medicament/:id",   modifierMedicament);
router.put("/consultation/:id", modifierConsultation);
router.put("/liberer-chambre/:patientId",  libererChambre);
router.put("/rendezVous/:id/statut", updateStatutRendezVous);
router.put(
    "/profil/:userId/photo",
    upload.single("photo"),  
    updatePhotoProfil
  );

export default router;
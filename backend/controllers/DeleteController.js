// controllers/deleteController.js

import Chambre from "../models/Chambre.js";
import Consultations from "../models/Consultation.js";
import Garde from "../models/Garde.js";
import Medicaments from "../models/Medicament.js";
import Notification from "../models/Notifications.js";
import Patients from "../models/Patients.js";
import ProduitExpire from "../models/ProduitExpire.js";
import RendezVous from "../models/Rendez-vous.js";

// controllers/deleteController.js

export const supprimerPatient = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Trouver le patient avant suppression
    const patient = await Patients.findByPk(id);

    if (!patient) {
      return res.status(404).json({ message: "Patient introuvable" });
    }

    // ✅ Si le patient avait une chambre → libérer la chambre
    if (patient.chambreId) {
      await Chambre.update(
        { occupe: 0 }, // ✅ 1 → 0 : chambre redevient disponible
        { where: { id: patient.chambreId } }
      );
      console.log(`Chambre ${patient.chambreId} libérée — occupe = 0`);
    }

    // ✅ Supprimer le patient
    await Patients.destroy({ where: { id } });

    res.json({ message: "Patient supprimé et chambre libérée" });

  } catch (error) {
    console.error("Erreur supprimerPatient:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};
  
  export const supprimerRendezVous = async (req, res) => {
    try {
      await RendezVous.destroy({ where: { id: req.params.id } });
      res.json({ message: "Rendez-vous supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  
  export const supprimerGarde = async (req, res) => {
    try {
      await Garde.destroy({ where: { id: req.params.id } });
      res.json({ message: "Garde supprimée" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  
  export const supprimerMedicament = async (req, res) => {
    try {
      await Medicaments.destroy({ where: { id: req.params.id } });
      res.json({ message: "Médicament supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };

  export const supprimerArcive = async (req, res) => {
    try {
      await ProduitExpire.destroy({ where: { id: req.params.id } });
      res.json({ message: "Médicament supprimé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  
  export const supprimerConsultation = async (req, res) => {
    try {
      await Consultations.destroy({ where: { id: req.params.id } });
      res.json({ message: "Consultation supprimée" });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  export const suprimerOrdonance =  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Notification.destroy({ where: { id } });
  
      if (!deleted) {
        return res.status(404).json({ message: "Ordonnance introuvable" });
      }
  
      res.json({ message: "Ordonnance supprimée" });
    } catch (err) {
      console.error("Erreur suppression ordonnance:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
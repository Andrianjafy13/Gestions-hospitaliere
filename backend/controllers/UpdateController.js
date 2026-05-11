// controllers/updateController.js

import Consultations from "../models/Consultation.js";
import Garde from "../models/Garde.js";
import Medicaments from "../models/Medicament.js";
import Patients from "../models/Patients.js";
import RendezVous from "../models/Rendez-vous.js";

// ✅ Modifier Patient
export const modifierPatient = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nom, prenom, dateNaissance, sexe, adresse,
        telephone, typePatient, allergies, groupeSanguin,
        observation, medecinId
      } = req.body;
  
      const patient = await Patients.findByPk(id);
      if (!patient) return res.status(404).json({ message: "Patient introuvable" });
  
      await patient.update({
        nom, prenom, dateNaissance, sexe, adresse,
        telephone, typePatient, allergies, groupeSanguin,
        observation, medecinId
      });
  
      res.json({ message: "Patient modifié", patient });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", detail: error.message });
    }
  };
  
  // ✅ Modifier RendezVous
  export const modifierRendezVous = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        patientId, medecinId, dateRendezVous,
        heureRendezVous, typeConsultation, priorite, motifRendezVous
      } = req.body;
  
      const rdv = await RendezVous.findByPk(id);
      if (!rdv) return res.status(404).json({ message: "Rendez-vous introuvable" });
  
      await rdv.update({
        patientId, medecinId, dateRendezVous,
        heureRendezVous, typeConsultation, priorite, motifRendezVous
      });
  
      res.json({ message: "Rendez-vous modifié", rdv });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", detail: error.message });
    }
  };
  
  // ✅ Modifier Garde
  export const modifierGarde = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        infirmierId, typeGarde, dateDebut,
        dateFin, heureDebut, heureFin, service
      } = req.body;
  
      const garde = await Garde.findByPk(id);
      if (!garde) return res.status(404).json({ message: "Garde introuvable" });
  
      await garde.update({
        infirmierId, typeGarde, dateDebut,
        dateFin, heureDebut, heureFin, service
      });
  
      res.json({ message: "Garde modifiée", garde });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", detail: error.message });
    }
  };
  
  // ✅ Modifier Médicament
  export const modifierMedicament = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nomMedicament, categorie, forme,
        dosage, stock, prix, dateExpiration
      } = req.body;
  
      const med = await Medicaments.findByPk(id);
      if (!med) return res.status(404).json({ message: "Médicament introuvable" });
  
      await med.update({
        nomMedicament, categorie, forme,
        dosage, stock, prix, dateExpiration
      });
  
      res.json({ message: "Médicament modifié", med });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", detail: error.message });
    }
  };
  
  // ✅ Modifier Consultation
  export const modifierConsultation = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        patientId, medecinId, motif, diagnostic,
        traitement, dateConsultation, heureConsultation
      } = req.body;
  
      const consultation = await Consultations.findByPk(id);
      if (!consultation) return res.status(404).json({ message: "Consultation introuvable" });
  
      await consultation.update({
        patientId, medecinId, motif, diagnostic,
        traitement, dateConsultation, heureConsultation
      });
  
      res.json({ message: "Consultation modifiée", consultation });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", detail: error.message });
    }
  };

  // ✅ Décrémenter occupe quand patient quitte la chambre
export const libererChambre = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patients.findByPk(patientId);
    if (!patient || !patient.chambreId) {
      return res.status(404).json({ message: "Patient ou chambre introuvable" });
    }

    // ✅ Remettre occupe = 0
    await Chambre.update(
      { occupe: 0 }, // ✅ 1 → 0
      { where: { id: patient.chambreId } }
    );

    // ✅ Retirer chambre du patient
    await Patients.update(
      { chambreId: null },
      { where: { id: patientId } }
    );

    res.json({ message: "Chambre libérée — disponible à nouveau" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateStatutRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body; // "En attente" | "Validé"

    const rdv = await RendezVous.findByPk(id);
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }

    rdv.statut = statut;
    await rdv.save();

    res.json({ message: "Statut mis à jour", rdv });
  } catch (error) {
    console.error("Erreur updateStatutRendezVous:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};
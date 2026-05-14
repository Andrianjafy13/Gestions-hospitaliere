import Patients from "../models/Patients.js";
import Consultations from "../models/Consultation.js"
import RendezVous from "../models/Rendez-vous.js";
import Garde from "../models/Garde.js";
import { Op } from "sequelize";
import Medicaments from "../models/Medicament.js";
import User from "../models/Users.js";
import Notification from "../models/Notifications.js";
import Chambre from "../models/Chambre.js";
import SuiviPatient from "../models/suiviPatient.js";
import { parseOrdonnance } from "../utils/parseOrdonnance.js";
import { traiterStockOrdonnance } from "../services/stockService.js";
import { getIO } from "../socket.js";

export const patients = async (req, res) => {
  try {
    const {
      nom, prenom, dateNaissance, sexe,
      adresse, telephone, typePatient,
      allergies, groupeSanguin, observation,
      chambreId, medecinId,
    } = req.body;

    // ── 1. Validation des champs obligatoires ──────
    if (!nom || !prenom || !dateNaissance || !sexe || !telephone || !typePatient) {
      return res.status(400).json({
        message: "Champs obligatoires manquants.",
        manquants: [
          !nom          && "nom",
          !prenom       && "prenom",
          !dateNaissance && "dateNaissance",
          !sexe         && "sexe",
          !telephone    && "telephone",
          !typePatient  && "typePatient",
        ].filter(Boolean),
      });
    }

    // ── 2. Validation medecinId ────────────────────
    if (!medecinId || isNaN(parseInt(medecinId))) {
      return res.status(400).json({
        message: "medecinId est obligatoire et doit être un entier valide.",
      });
    }

    // ✅ Vérifier que le médecin existe vraiment en BDD
    const medecin = await User.findOne({
      where: { id: medecinId, role: "medecin" },
    });
    if (!medecin) {
      return res.status(404).json({
        message: `Aucun médecin trouvé avec l'id ${medecinId}.`,
      });
    }

    // ── 3. Gestion chambre (uniquement si Hospitalisé) ──
    // ✅ Les patients Externes et Urgence n'ont pas forcément de chambre
    let chambreAssignee = null;

    if (typePatient === "Hospitalisé") {

      if (!chambreId) {
        return res.status(400).json({
          message: "Une chambre est obligatoire pour un patient hospitalisé.",
        });
      }

      chambreAssignee = await Chambre.findByPk(chambreId);
      if (!chambreAssignee) {
        return res.status(404).json({
          message: `Chambre introuvable (id: ${chambreId}).`,
        });
      }

      if (chambreAssignee.occupe === 1) {
        return res.status(400).json({
          message: `La chambre ${chambreAssignee.numero} est déjà occupée.`,
        });
      }
    }

    // ── 4. Création du patient ─────────────────────
    const newPatient = await Patients.create({
      nom, prenom, dateNaissance, sexe,
      adresse, telephone, typePatient,
      allergies, groupeSanguin, observation,
      chambreId: chambreAssignee ? chambreId : null, // ✅ null si pas hospitalisé
      medecinId,
    });

    // ── 5. Marquer la chambre occupée si nécessaire ─
    if (chambreAssignee) {
      await Chambre.update(
        { occupe: 1 },
        { where: { id: chambreId } }
      );
    }

    // ── 6. Réponse avec patientId explicite ─────────
    return res.status(201).json({
      message:   "Patient enregistré avec succès.",
      patientId: newPatient.id,   // ✅ ID retourné pour la liaison frontend
      patient:   newPatient,
    });

  } catch (error) {
    console.error("Erreur création patient:", error);

    // ✅ Erreurs de validation Sequelize (enum invalide, champ trop long…)
    if (error.name === "SequelizeValidationError") {
      return res.status(422).json({
        message: "Données invalides.",
        erreurs: error.errors.map(e => e.message),
      });
    }

    return res.status(500).json({
      message: "Erreur serveur.",
      detail:  error.message,
    });
  }
};

export const CreationConsultation = async (req, res) => {
  try {
    const {
      patientId, medecinId, motif, diagnostic,
      traitement, dateConsultation, heureConsultation,
    } = req.body;

    // ── 1. Créer la consultation ─────────────────────────────────
    const consultation = await Consultations.create({
      patientId, medecinId, motif, diagnostic,
      traitement, dateConsultation, heureConsultation,
    });

    // ── 2. Récupérer patient + médecin ───────────────────────────
    const [patient, medecin] = await Promise.all([
      Patients.findByPk(patientId, { attributes: ["nom", "prenom"] }),
      User.findByPk(medecinId,     { attributes: ["nom", "prenom"] }),
    ]);

    const patientNom = `${patient?.prenom} ${patient?.nom}`;
    const medecinNom = `Dr. ${medecin?.prenom} ${medecin?.nom}`;

    // ── 3. Notification ordonnance → pharmacie ───────────────────
    if (traitement) {
      await Notification.create({
        type:           "ordonnance",
        destinataire:   "pharmacie",
        consultationId: consultation.id,
        patientNom,
        medecinNom,
        traitement,
        vu:             false,
      });
    }

    // ── 4. Traitement automatique du stock ───────────────────────
    if (traitement) {
      const lignes = parseOrdonnance(traitement);
      const io     = getIO();

      // Fonction notifier → émet sur la room "pharmacie"
      const notifier = (payload) => {
        io.to("pharmacie").emit("alerte_stock", {
          ...payload,
          consultationId: consultation.id,
          patientNom,
          medecinNom,
          horodatage: new Date().toISOString(),
        });
      };

      const rapport = await traiterStockOrdonnance(
        lignes,
        notifier,
        { patientNom, medecinNom, consultationId: consultation.id }
      );

      // Log rapport en dev
      if (process.env.NODE_ENV !== "production") {
        console.log("📦 Rapport stock :", JSON.stringify(rapport, null, 2));
      }

      return res.status(201).json({
        message:    "Consultation créée",
        consultation,
        rapportStock: rapport,   // ← utile pour debug côté frontend
      });
    }

    res.status(201).json({ message: "Consultation créée", consultation });

  } catch (error) {
    console.error("Erreur CreationConsultation:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

export const rendezVous = async (req, res) => {
  try {
    const { patientId, medecinId, dateRendezVous, heureRendezVous, typeConsultation,priorite, motifRendezVous } = req.body;
    if (!patientId || !medecinId || !dateRendezVous || !heureRendezVous || !typeConsultation) {
      return res.status(400).json({
        message: "Remplir les champs obligatoires manquants",
      });
    }

    const now = new Date();
    const newRendezVous = await RendezVous.create({
      patientId,
      medecinId,
      dateRendezVous,
      heureRendezVous: now.toTimeString().slice(0, 8),
      typeConsultation,
      priorite,
      motifRendezVous,
      vu: false,
    });

    res.status(201).json({
      message: "Rendez-vous enregistrée avec succès ✅",
      rendezVous: newRendezVous,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Endpoint 2 — Compter les RDV non vus pour un médecin
// Appelé par la page du médecin pour afficher le badge
// ✅ Correction getNonVus
export const getNonVus = async (req, res) => {
  try {
    const { medecinId } = req.params;


    const count = await RendezVous.count({
      where: {
        medecinId,
        vu: false, // ✅ compter seulement vu = false
      },
    });


    res.json({ nonVus: count });
  } catch (error) {
    console.error("Erreur getNonVus:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
export const marquerVus = async (req, res) => {
  try {
    const medecinId = parseInt(req.params.medecinId); // ✅ convertir en number

    console.log("marquerVus medecinId:", medecinId, typeof medecinId);

    // ✅ Vérifier avant update
    const avant = await RendezVous.count({
      where: { medecinId, vu: false }
    });
    console.log("RDV non vus avant update:", avant);

    const [nbMisAJour] = await RendezVous.update(
      { vu: true },
      { where: { medecinId, vu: false } }
    );

    console.log("RDV marqués vus:", nbMisAJour);

    // ✅ Vérifier après update
    const apres = await RendezVous.count({
      where: { medecinId, vu: false }
    });
    console.log("RDV non vus après update:", apres);

    res.json({ message: "OK", nbMisAJour });
  } catch (error) {
    console.error("Erreur marquerVus:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// CODE POUR L'INFIRMIER

export const creerGarde = async (req, res) => {
  try {
    const {
      infirmierId,
      typeGarde,
      dateDebut,
      dateFin,
      heureDebut,
      heureFin,
      service
    } = req.body;

    // Vérification
    if (!infirmierId) {
      return res.status(400).json({ message: "Infirmier requis" });
    }

    // Vérifier chevauchement
    const chevauchement = await Garde.findOne({
      where: {
        infirmierId,
        dateDebut: { [Op.lte]: dateFin },
        dateFin: { [Op.gte]: dateDebut },
      },
    });

    if (chevauchement) {
      return res.status(400).json({
        message: "Cet infirmier a déjà une garde sur cette période"
      });
    }

    const garde = await Garde.create({
      infirmierId,
      typeGarde,
      dateDebut,
      dateFin,
      heureDebut,
      heureFin,
      service
    });

    res.status(201).json(garde);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const ajoutMedecament = async (req, res) => {
  try {
    const {
      nomMedicament,
      categorie,
      forme,
      dosage,
      stock,
      prix,
      dateExpiration
    } = req.body;

    // ✅ Validation
    if (!nomMedicament || !categorie || !forme || !dosage || !stock || !prix || !dateExpiration) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires"
      });
    }

    const newMedicament = await Medicaments.create({
      nomMedicament,
      categorie,
      forme,
      dosage,
      stock,
      prix,
      dateExpiration
    });

    res.status(201).json({
      message: "Médicament ajouté",
      medicament: newMedicament
    });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

export const ajoutChambre = async (req, res) => {
  try {
    const { numero, capacite } = req.body;

    // ✅ validation
    if (!numero || !capacite) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires"
      });
    }

    const newChambre = await Chambre.create({
      numero,
      capacite,
      occupe: 0 // ✅ cohérent
    });

    res.status(201).json({
      message: "Chambre ajoutée avec succès",
      chambre: newChambre
    });
    console.log(newChambre)

  } catch (error) {
    console.error("Erreur backend:", error);

    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

export const ajouterSuivi = async (req, res) => {
  try {
    const { temperature, tension, symptome, patientId } = req.body;

    console.log("BODY reçu:", req.body);

    if (!temperature || !tension || !patientId) {
      return res.status(400).json({
        message: "Champs obligatoires : temperature, tension, patientId"
      });
    }

    const patient = await Patients.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient introuvable." });
    }

    // ✅ Convertir température string → number
    const convertTemp = {
      basse:   36.0,
      normale: 37.0,
      elevee:  38.5,
    };

    const temperatureNum = convertTemp[temperature];
    if (!temperatureNum) {
      return res.status(400).json({ message: "Valeur de température invalide." });
    }

    // ✅ Convertir tension string → évaluation
    // tension "12/8" → systolique = 12, diastolique = 8
    const [systolique] = tension.split("/").map(Number);
    const tensionElevee = systolique > 14; // ✅ > 14 = tension élevée

    const aSymptomes = symptome && symptome.trim().length > 0;

    // ✅ Règles de décision
    let nouveauTypePatient = patient.typePatient; // garder l'ancien par défaut
    let messageDecision    = "";

    if (
      temperature === "normale" &&
      !tensionElevee &&
      !aSymptomes
    ) {
      // ✅ Règle 1 — Tout normal → Externe
      nouveauTypePatient = "Externe";
      messageDecision    = "Patient en bonne santé — type mis à jour : Externe";

    } else if (
      temperature === "normale" &&
      tensionElevee &&
      aSymptomes
    ) {
      // ✅ Règle 2 — Tension élevée + symptômes → Hospitalisé
      nouveauTypePatient = "Hospitalisé";
      messageDecision    = "Tension élevée avec symptômes — type mis à jour : Hospitalisé";

    } else if (
      temperature === "elevee" &&
      tensionElevee &&
      aSymptomes
    ) {
      // ✅ Règle 3 — Température + tension élevées + symptômes → Urgence
      nouveauTypePatient = "Urgence";
      messageDecision    = "État critique — type mis à jour : Urgence";
    }

    // ✅ Créer le suivi
    const suivi = await SuiviPatient.create({
      temperature: temperatureNum,
      tension,
      symptome:    symptome || "",
      patientId,
    });

    // ✅ Mettre à jour le typePatient du patient
    await Patients.update(
      { typePatient: nouveauTypePatient },
      { where: { id: patientId } }
    );

    console.log("Suivi inséré:", suivi.toJSON());
    console.log("Nouveau typePatient:", nouveauTypePatient);

    res.status(201).json({
      message:          "Suivi ajouté avec succès",
      suivi,
      typePatient:      nouveauTypePatient,
      messageDecision,  // ✅ message pour le frontend
      ancienType:       patient.typePatient,
    });

  } catch (error) {
    console.error("Erreur ajouterSuivi:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

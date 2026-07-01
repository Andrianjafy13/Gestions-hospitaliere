import { Sequelize, where } from "sequelize";
import Consultations from "../models/Consultation.js";
import Patients from "../models/Patients.js";
import User from "../models/Users.js";
import RendezVous from "../models/Rendez-vous.js";
import Garde from "../models/Garde.js";
import Medicaments from "../models/Medicament.js";
import Notification from "../models/Notifications.js";
import Chambre from "../models/Chambre.js";
import { Op } from "sequelize";
import SuiviPatient from "../models/suiviPatient.js";
import ProduitExpire from "../models/ProduitExpire.js";


export const getListePatients = async (req, res) => {
  try {
    const { medecinId } = req.params;

    // ✅ Validation medecinId
    if (!medecinId || isNaN(parseInt(medecinId))) {
      return res.status(400).json({ message: "medecinId invalide." });
    }

    const listePatients = await Patients.findAll({
      where: { medecinId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Chambre,
          as: "chambre",
          attributes: ["id", "numero", "capacite"], 
          required: false,                       
        },
        {
          model: User,
          as: "medecin",
          attributes: ["id", "nom", "prenom"],  
        },
      ],
    });

    return res.status(200).json(listePatients);

  } catch (error) {
    console.error("Erreur récupération patients:", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      detail:  error.message,
    });
  }
};

// Récupérer les patients + médecin pour le formulaire
export const getPatients = async (req, res) => {
    try {
      const patients = await Patients.findAll({
        attributes: ["id", "nom", "prenom"], // récupérer nom + prénom
      });
      res.status(200).json(patients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };

  export const getPatientsRecep = async (req, res) => {
    try {
      const patients = await Patients.findAll({
        attributes: ["id", "nom", "prenom"], // récupérer nom + prénom
      });
      res.status(200).json(patients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };

  // Récupérer les médecin pour le formulaire
  export const getMedecin = async (req, res) => {
    try {
      const medecin = await User.findAll({
        attributes: ["id", "prenom", "nom", "specialite"], 
        where: {
          role: "medecin", 
        },
        order: [["prenom", "ASC"]], 
      });
      res.status(200).json(medecin);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };

// Recuperer les consultations

export const getConsultations = async (req, res) => {
  try {
    
    const consultation = await Consultations.findAll({
      where: { medecinId: req.params.medecinId },
      include: [
        {
          model: Patients,
          as: "patients",
          attributes: ["nom", "prenom","dateNaissance","sexe","telephone","groupeSanguin","allergies","typePatient"],
        },
        {
          model: User,
          as: "medecin",
          attributes: ["prenom"],
        },
      ],
      order: [["dateConsultation", "DESC"]] // 🔥 timeline
    });
    if(!consultation) {
      res.status(404).json({message: "Aucun consultation enregistrer par le médecin"});
    }
    res.status(201).json(consultation);
  } catch (error) {
    console.error("Erreur récupération consultation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Recuperer le count de consultation

// STATS AVEC FILTRE MEDECIN

export const getStats = async (req, res) => {
  try {
    const { medecinId } = req.params;

    // ✅ Ignorer "null" string ou valeur vide
    const whereCondition =
      medecinId && medecinId !== "null" && medecinId !== "undefined"
        ? { medecinId }
        : {};

    const totalConsultations = await Consultations.count({
      where: whereCondition,
    });

    const patientsUniques = await Consultations.count({
      distinct: true,
      col: "patientId",
      where: whereCondition,
    });
    const patientsEnregistrer = await Patients.count({
      where: medecinId && medecinId !== "null" && medecinId !== "all"
        ? { medecinId }  
        : {},
    });
    const totalRendezVous = await RendezVous.count({
      where: medecinId && medecinId !== "null" && medecinId !== "all"
        ? { medecinId }  
        : {},
    });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const consultationsToday = await Consultations.count({
      where: {
        ...whereCondition,
        dateConsultation: {
          [Sequelize.Op.gte]: startOfDay, 
          [Sequelize.Op.lte]: endOfDay,   
        },
      },
    });

    res.json({ totalConsultations,totalRendezVous, patientsUniques,patientsEnregistrer, consultationsToday });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getChartData = async (req, res) => {
  try {
    const { medecinId } = req.params;

    const whereCondition =
      medecinId && medecinId !== "null" && medecinId !== "undefined"
        ? { medecinId }
        : {};

    // ✅ Filtrer uniquement aujourd'hui
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const data = await Consultations.findAll({
      attributes: [
        [
          Sequelize.fn(
            "TIME_FORMAT",
            Sequelize.col("heureConsultation"),
            "%H"
          ),
          "heure",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: {
        ...whereCondition,
        dateConsultation: {
          [Sequelize.Op.gte]: startOfDay,
          [Sequelize.Op.lte]: endOfDay,
        },
      },
      group: ["heure"],
      order: [
        [
          Sequelize.fn("TIME_FORMAT", Sequelize.col("heureConsultation"), "%H"),
          "ASC",
        ],
      ],
    });
    const formatted = data.map((item) => ({
      heure: `${item.get("heure")}h`,
      total: parseInt(item.get("total")),
    }));

    res.json(formatted);

  } catch (error) {
    console.error("Erreur getChartData:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

export const getStatsMensuelles = async (req, res) => {
  try {
    const { medecinId } = req.params;

    const whereCondition =
      medecinId && medecinId !== "null" && medecinId !== "all"
        ? { medecinId }
        : {};

    const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

    // ✅ Consultations par mois
    const consultations = await Consultations.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("dateConsultation")), "mois"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: whereCondition,
      group: ["mois"],
      order: [[Sequelize.fn("MONTH", Sequelize.col("dateConsultation")), "ASC"]],
    });

    // ✅ Patients uniques par mois
    const patients = await Consultations.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("dateConsultation")), "mois"],
        [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("patientId"))), "total"],
      ],
      where: whereCondition,
      group: ["mois"],
      order: [[Sequelize.fn("MONTH", Sequelize.col("dateConsultation")), "ASC"]],
    });

    // ✅ Rendez-vous par mois
    const rendezvous = await RendezVous.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("dateRendezVous")), "mois"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: whereCondition,
      group: ["mois"],
      order: [[Sequelize.fn("MONTH", Sequelize.col("dateRendezVous")), "ASC"]],
    });

    // ✅ Construire tableau de 12 mois
    const buildArray = (data) => {
      const arr = new Array(12).fill(0);
      data.forEach(item => {
        const idx = parseInt(item.get("mois")) - 1;
        arr[idx] = parseInt(item.get("total"));
      });
      return arr;
    };

    res.json({
      mois: moisLabels,
      consultations: buildArray(consultations),
      patients: buildArray(patients),
      rendezvous: buildArray(rendezvous),
    });

  } catch (error) {
    console.error("Erreur getStatsMensuelles:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

export const getRendezVousMedecin = async (req, res) => {
  try {
    const { medecinId } = req.params;

    // ✅ Suppression du filtre semaine — on récupère tous les RDV futurs
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    const rdvs = await RendezVous.findAll({
      where: {
        medecinId,
        dateRendezVous: {
          [Sequelize.Op.gte]: aujourd_hui, // ← à partir d'aujourd'hui
        },
      },
      include: [
        {
          model: Patients,
          attributes: ["nom", "prenom"],
          as: "patients",
        },
      ],
      order: [["dateRendezVous", "ASC"], ["heureRendezVous", "ASC"]],
    });

    res.json(rdvs);
  } catch (error) {
    console.error("Erreur getRendezVousMedecin:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

export const getListeRendezVous = async (req, res) => {
  try {
    const rendezvous = await RendezVous.findAll();
    res.status(200).json(rendezvous);
    console.log(rendezvous)
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

export const getInfirmerie = async (req, res) => {
  try {
    const infirmier = await User.findAll({
      attributes: ["id", "prenom", "nom"], 
      where: {
        role: "infirmier", 
      },
      order: [["prenom", "ASC"]], 
    });
    res.status(200).json(infirmier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getGardes = async (req, res) => {
  try {
    const gardes = await Garde.findAll({
      include: {
        model: User,
        as: "infirmier",
        attributes: ["nom", "prenom"], 
        where: { role: "infirmier" },  
      },
      order: [["dateDebut", "ASC"]],
    });

    res.json(gardes);
    console.log(gardes)
  } catch (error) {
    console.error("Erreur getGardes:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};


export const getMedicaments = async (req, res) => {
  try {
    const medicaments = await Medicaments.findAll({
      where: { statut: "actif" },
      order: [["dateExpiration", "ASC"]],
    });

    res.status(200).json(medicaments);
    console.log(medicaments)
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const getMedicamentExpire = async (req, res) => {
  try {
    const expires = await ProduitExpire.findAll({
      order: [["dateArchivage", "DESC"]],
    });
    res.json(expires);
    console.log(expires)
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
};

// controllers/notificationController.js

// ✅ Compter notifications non vues pour la pharmacie
export const getNonVusPharmacien = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { destinataire: "pharmacie", vu: false },
    });

    res.json({ nonVus: count });

  } catch (error) {
    console.error("ERREUR BACKEND :", error); 
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

// ✅ Récupérer toutes les ordonnances non délivrées
export const getOrdonnancesPharmacien = async (req, res) => {
  try {
    const ordonnances = await Notification.findAll({
      where: { destinataire: "pharmacie", type: "ordonnance" },
      order: [["createdAt", "DESC"]],
    });
    res.json(ordonnances);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Marquer toutes comme vues
export const marquerVusPharmacien = async (req, res) => {
  try {
    await Notification.update(
      { vu: true },
      { where: { destinataire: "pharmacie", vu: false } }
    );
    res.json({ message: "Marqué comme vu" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Marquer une ordonnance comme délivrée
export const marquerDelivree = async (req, res) => {
  try {
    await Notification.update(
      { vu: true },
      { where: { id: req.params.id } }
    );
    res.json({ message: "Ordonnance délivrée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET CHAMBRE

// controllers/patientController.js

export const ajoutPatient = async (req, res) => {
  try {
    const {
      nom, prenom, dateNaissance, sexe, adresse,
      telephone, typePatient, allergies, groupeSanguin,
      observation, chambreId, medecinId
    } = req.body;

    // ✅ Vérification chambre si patient hospitalisé ou urgence
    if (chambreId && (typePatient === "Hospitalisé" || typePatient === "Urgence")) {

      const chambre = await Chambre.findByPk(chambreId);

      if (!chambre) {
        return res.status(404).json({ message: "Chambre introuvable." });
      }

      // ✅ Vérifier si la chambre a encore de la place
      if (chambre.occupe >= chambre.capacite) {
        return res.status(400).json({
          message: `La chambre ${chambre.numero} est complète (${chambre.occupe}/${chambre.capacite}).`
        });
      }

      // ✅ Créer le patient
      const patient = await Patients.create({
        nom, prenom, dateNaissance, sexe, adresse,
        telephone, typePatient, allergies, groupeSanguin,
        observation, chambreId, medecinId
      });

      // ✅ Incrémenter occupe dans la chambre
      await Chambre.update(
        { occupe: chambre.occupe + 1 },
        { where: { id: chambreId } }
      );

      return res.status(201).json({
        message: "Patient enregistré et chambre mise à jour",
        patient,
        chambre: {
          numero:          chambre.numero,
          capacite:        chambre.capacite,
          occupe:          chambre.occupe + 1,
          placesRestantes: chambre.capacite - chambre.occupe - 1,
        }
      });
    }

    // ✅ Patient externe — pas de chambre
    const patient = await Patients.create({
      nom, prenom, dateNaissance, sexe, adresse,
      telephone, typePatient, allergies, groupeSanguin,
      observation, chambreId: null, medecinId
    });

    res.status(201).json({
      message: "Patient enregistré",
      patient
    });

  } catch (error) {
    console.error("Erreur ajoutPatient:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

// ✅ Chambres disponibles — seulement celles avec places restantes
export const getChambresDisponibles = async (req, res) => {
  try {
    const chambres = await Chambre.findAll({
      where: {
        occupe: 0, // ✅ uniquement les chambres libres
      },
      order: [["numero", "ASC"]],
    });
    res.json(chambres);
  } catch (error) {
    console.error("Erreur getChambresDisponibles:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getPatientHospitalise = async (req, res) => {
  try {
    // ✅ Total hospitalisés + urgences confondus
    const totalHospitalise = await Patients.count({
      where: {
        typePatient: {
          [Sequelize.Op.in]: ["Hospitalisé", "Urgence"]
        }
      },
    });

    // ✅ Total urgences seulement
    const totalUrgence = await Patients.count({
      where: {
        typePatient: "Urgence"
      },
    });
    const maintenant = new Date();
    const totalGarde = await Garde.count({
      where: {
        dateDebut: { [Sequelize.Op.lte]: maintenant },
        dateFin:   { [Sequelize.Op.gte]: maintenant },
      },
    });

    console.log("totalGarde:", totalGarde);

    // ✅ Retourner un objet avec les deux valeurs
    res.json({
      totalHospitalise,
      totalUrgence,
      totalGarde,
    });

  } catch (error) {
    console.error("Erreur getPatientHospitalise:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Backend — endpoint dédié
export const getPatientsHospitalises = async (req, res) => {
  try {
    const patients = await Patients.findAll({
      where: {
        typePatient: {
          [Sequelize.Op.in]: ["Hospitalisé", "Urgence"] // ✅ filtre backend
        }
      },
      include: [{
        model: Chambre,
        as: "chambre",
        attributes: ["numero"],
        required: false,
      }],
      order: [["nom", "ASC"]],
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Récupérer les suivis d'un patient
export const getSuivisPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const suivis = await SuiviPatient.findAll({
      where: { patientId },
      order: [["createdAt", "DESC"]],
    });

    res.json(suivis);
  } catch (error) {
    console.error("Erreur getSuivisPatient:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Compter médicaments + alertes rupture de stock
export const getStatsPatientsAssignesJour = async (req, res) => {
  try {
    const getDateKey = (value) => {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
      }

      const date = new Date(value);
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${date.getFullYear()}-${month}-${day}`;
    };

    const joursDemandes = parseInt(req.query.jours, 10);
    const nombreJours = Number.isNaN(joursDemandes)
      ? 14
      : Math.min(Math.max(joursDemandes, 7), 60);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const debut = new Date(fin);
    debut.setDate(fin.getDate() - (nombreJours - 1));
    debut.setHours(0, 0, 0, 0);

    const filtrePatientsAssignes = {
      typePatient: {
        [Op.in]: ["Hospitalisé", "Urgence"],
      },
    };

    const lignesParJour = await Patients.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: {
        ...filtrePatientsAssignes,
        createdAt: {
          [Op.between]: [debut, fin],
        },
      },
      group: [Sequelize.fn("DATE", Sequelize.col("createdAt"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    const compteurParDate = new Map(
      lignesParJour.map((ligne) => [
        getDateKey(ligne.date),
        parseInt(ligne.total, 10) || 0,
      ])
    );

    const statsParJour = [];
    for (let index = 0; index < nombreJours; index += 1) {
      const date = new Date(debut);
      date.setDate(debut.getDate() + index);
      const isoDate = getDateKey(date);

      statsParJour.push({
        date: isoDate,
        label: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        total: compteurParDate.get(isoDate) || 0,
      });
    }

    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);

    const [
      totalAssignes,
      totalHospitalises,
      totalUrgences,
      assignesAujourdhui,
      patientsRecents,
    ] = await Promise.all([
      Patients.count({ where: filtrePatientsAssignes }),
      Patients.count({ where: { typePatient: "Hospitalisé" } }),
      Patients.count({ where: { typePatient: "Urgence" } }),
      Patients.count({
        where: {
          ...filtrePatientsAssignes,
          createdAt: { [Op.between]: [debutJour, finJour] },
        },
      }),
      Patients.findAll({
        where: filtrePatientsAssignes,
        attributes: ["id", "nom", "prenom", "typePatient", "createdAt"],
        include: [
          {
            model: Chambre,
            as: "chambre",
            attributes: ["numero"],
            required: false,
          },
          {
            model: User,
            as: "medecin",
            attributes: ["nom", "prenom"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 6,
      }),
    ]);

    res.json({
      resume: {
        totalAssignes,
        totalHospitalises,
        totalUrgences,
        assignesAujourdhui,
      },
      parJour: statsParJour,
      patientsRecents,
    });
  } catch (error) {
    console.error("Erreur getStatsPatientsAssignesJour:", error);
    res.status(500).json({
      message: "Erreur serveur",
      detail: error.message,
    });
  }
};

export const getCountMedicament = async (req, res) => {
  try {

    // ✅ await obligatoire
    const totalMedicament = await Medicaments.count();

    // ✅ Médicaments en rupture de stock (stock = 0)
    const ruptureStock = await Medicaments.findAll({
      where: {
        stock: 0, 
      },
      attributes: ["id", "nomMedicament", "stock", "forme", "dosage"],
    });

    // ✅ Médicaments stock faible (stock <= 10 mais > 0)
    const stockFaible = await Medicaments.findAll({
      where: {
        stock: {
          [Sequelize.Op.gt]: 5,  // stock > 0
          [Sequelize.Op.lte]: 10, // stock <= 10
        },
      },
      attributes: ["id", "nomMedicament", "stock", "forme", "dosage"],
    });
    const stockCritique = await Medicaments.findAll({
      where: {
        stock: {
          [Sequelize.Op.gt]: 0,  // stock > 0
          [Sequelize.Op.lte]: 5, // stock <= 10
        },
      },
      attributes: ["id", "nomMedicament", "stock", "forme", "dosage", "dateExpiration"],
    });

    // ✅ Médicaments expirant dans 30 jours
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    const expirentBientot = await Medicaments.findAll({
      where: {
        dateExpiration: {
          [Sequelize.Op.between]: [new Date(), dans30Jours],
        },
      },
      attributes: ["id", "nomMedicament", "stock", "dateExpiration"],
    });

    console.log("totalMedicament:", totalMedicament);
    console.log("ruptureStock:", ruptureStock.length);
    console.log("stockFaible:", stockFaible.length);
    console.log("stockCritique:", stockCritique.length);

    res.json({
      totalMedicament,
      ruptureStock,      
      stockFaible,
      stockCritique,      
      expirentBientot,   
    });

  } catch (error) {
    console.error("Erreur getCountMedicament:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ── Stats KPIs ────────────────────────────────────────────
export const getStatsReceptionniste = async (req, res) => {
  try {
    const [patients, valides, enAttente, annules] = await Promise.all([
      Patients.count(),
      RendezVous.count({ where: { statut: "Validé"     } }),
      RendezVous.count({ where: { statut: "En attente" } }),
      RendezVous.count({ where: { statut: "Annulé"     } }),
    ]);

    res.json({ patients, valides, enAttente, annules });
    console.log(patients)
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
};

// ── Prochains RDV ─────────────────────────────────────────
export const getProchainRdv = async (req, res) => {
  try {
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    const rdvs = await RendezVous.findAll({
      where: {
        dateRendezVous: { [Op.gte]: aujourd_hui },
        statut: { [Op.ne]: "Annulé" },
      },
      include: [
        { model: Patients, as: "patients", attributes: ["nom", "prenom"] },
        { model: User,     as: "medecin",  attributes: ["nom", "prenom"] },
      ],
      order: [["dateRendezVous", "ASC"], ["heureRendezVous", "ASC"]],
      limit: 5,
    });

    res.json(rdvs);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
};

export const getListePatientsReceptionniste = async (req, res) => {
  try {
    const patients = await Patients.findAll({
      include: [
        { model: User, as: "medecin", attributes: ["nom", "prenom"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
};

// Ajouter dans getController.js

// ✅ Stats ordonnances par mois (12 derniers mois)
export const getStatsOrdonnancess = async (req, res) => {
  try {
    const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Juin",
                        "Juil","Août","Sep","Oct","Nov","Déc"];

    const maintenant  = new Date();
    const anneeActuelle = maintenant.getFullYear();

    // ✅ 12 derniers mois depuis aujourd'hui
    const debut12Mois = new Date();
    debut12Mois.setMonth(debut12Mois.getMonth() - 11);
    debut12Mois.setDate(1);
    debut12Mois.setHours(0, 0, 0, 0);

    // ✅ Ordonnances traitées par mois (vu = true = délivrée)
    const ordonnancesParMois = await Notification.findAll({
      attributes: [
        [Sequelize.fn("MONTH",  Sequelize.col("createdAt")), "mois"],
        [Sequelize.fn("YEAR",   Sequelize.col("createdAt")), "annee"],
        [Sequelize.fn("COUNT",  Sequelize.col("id")),        "total"],
      ],
      where: {
        destinataire: "pharmacie",
        type:         "ordonnance",
        createdAt:    { [Op.gte]: debut12Mois },
      },
      group: ["annee", "mois"],
      order: [
        [Sequelize.fn("YEAR",  Sequelize.col("createdAt")), "ASC"],
        [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"],
      ],
      raw: true,
    });

    // ✅ Ordonnances délivrées par mois (vu = true)
    const delivreesParMois = await Notification.findAll({
      attributes: [
        [Sequelize.fn("MONTH",  Sequelize.col("createdAt")), "mois"],
        [Sequelize.fn("YEAR",   Sequelize.col("createdAt")), "annee"],
        [Sequelize.fn("COUNT",  Sequelize.col("id")),        "total"],
      ],
      where: {
        destinataire: "pharmacie",
        type:         "ordonnance",
        vu:           true,
        createdAt:    { [Op.gte]: debut12Mois },
      },
      group: ["annee", "mois"],
      order: [
        [Sequelize.fn("YEAR",  Sequelize.col("createdAt")), "ASC"],
        [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"],
      ],
      raw: true,
    });

    // ✅ Construire les 12 derniers mois avec labels
    const labels   = [];
    const totales  = [];
    const deliv    = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1; // 1-12
      const a = d.getFullYear();

      labels.unshift(`${moisLabels[d.getMonth()]} ${a}`);

      const found  = ordonnancesParMois.find(r => parseInt(r.mois) === m && parseInt(r.annee) === a);
      const foundD = delivreesParMois.find(r   => parseInt(r.mois) === m && parseInt(r.annee) === a);

      totales.unshift(found  ? parseInt(found.total)  : 0);
      deliv.unshift(foundD   ? parseInt(foundD.total) : 0);
    }

    // ✅ Total général
    const totalOrdonnances  = await Notification.count({
      where: { destinataire: "pharmacie", type: "ordonnance" },
    });
    const totalDelivrees    = await Notification.count({
      where: { destinataire: "pharmacie", type: "ordonnance", vu: true },
    });
    const totalEnAttente    = totalOrdonnances - totalDelivrees;

    res.json({
      labels,
      ordonnances: totales,
      delivrees:   deliv,
      stats: {
        totalOrdonnances,
        totalDelivrees,
        totalEnAttente,
      },
    });

  } catch (error) {
    console.error("Erreur getStatsOrdonnances:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

// ✅ Commandes récentes (ordonnances triées par date décroissante)
export const getCommandesRecentess = async (req, res) => {
  try {
    const { limit = 10, mois, annee } = req.query;

    const where = {
      destinataire: "pharmacie",
      type:         "ordonnance",
    };

    // ✅ Filtre par mois/année si fourni
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      const fin   = new Date(parseInt(annee), parseInt(mois),     1);
      where.createdAt = { [Op.gte]: debut, [Op.lt]: fin };
    }

    const commandes = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]], // ✅ plus récente en premier
      limit: parseInt(limit),
    });

    res.json(commandes);
  } catch (error) {
    console.error("Erreur getCommandesRecentes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};// Ajouter dans getController.js

// ✅ Stats ordonnances par mois (12 derniers mois)
export const getStatsOrdonnances = async (req, res) => {
  try {
    const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Juin",
                        "Juil","Août","Sep","Oct","Nov","Déc"];

    const maintenant  = new Date();
    const anneeActuelle = maintenant.getFullYear();

    // ✅ 12 derniers mois depuis aujourd'hui
    const debut12Mois = new Date();
    debut12Mois.setMonth(debut12Mois.getMonth() - 11);
    debut12Mois.setDate(1);
    debut12Mois.setHours(0, 0, 0, 0);

    // ✅ Ordonnances traitées par mois (vu = true = délivrée)
    const ordonnancesParMois = await Notification.findAll({
      attributes: [
        [Sequelize.fn("MONTH",  Sequelize.col("createdAt")), "mois"],
        [Sequelize.fn("YEAR",   Sequelize.col("createdAt")), "annee"],
        [Sequelize.fn("COUNT",  Sequelize.col("id")),        "total"],
      ],
      where: {
        destinataire: "pharmacie",
        type:         "ordonnance",
        createdAt:    { [Op.gte]: debut12Mois },
      },
      group: ["annee", "mois"],
      order: [
        [Sequelize.fn("YEAR",  Sequelize.col("createdAt")), "ASC"],
        [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"],
      ],
      raw: true,
    });

    // ✅ Ordonnances délivrées par mois (vu = true)
    const delivreesParMois = await Notification.findAll({
      attributes: [
        [Sequelize.fn("MONTH",  Sequelize.col("createdAt")), "mois"],
        [Sequelize.fn("YEAR",   Sequelize.col("createdAt")), "annee"],
        [Sequelize.fn("COUNT",  Sequelize.col("id")),        "total"],
      ],
      where: {
        destinataire: "pharmacie",
        type:         "ordonnance",
        vu:           true,
        createdAt:    { [Op.gte]: debut12Mois },
      },
      group: ["annee", "mois"],
      order: [
        [Sequelize.fn("YEAR",  Sequelize.col("createdAt")), "ASC"],
        [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"],
      ],
      raw: true,
    });

    // ✅ Construire les 12 derniers mois avec labels
    const labels   = [];
    const totales  = [];
    const deliv    = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1; // 1-12
      const a = d.getFullYear();

      labels.unshift(`${moisLabels[d.getMonth()]} ${a}`);

      const found  = ordonnancesParMois.find(r => parseInt(r.mois) === m && parseInt(r.annee) === a);
      const foundD = delivreesParMois.find(r   => parseInt(r.mois) === m && parseInt(r.annee) === a);

      totales.unshift(found  ? parseInt(found.total)  : 0);
      deliv.unshift(foundD   ? parseInt(foundD.total) : 0);
    }

    // ✅ Total général
    const totalOrdonnances  = await Notification.count({
      where: { destinataire: "pharmacie", type: "ordonnance" },
    });
    const totalDelivrees    = await Notification.count({
      where: { destinataire: "pharmacie", type: "ordonnance", vu: true },
    });
    const totalEnAttente    = totalOrdonnances - totalDelivrees;

    res.json({
      labels,
      ordonnances: totales,
      delivrees:   deliv,
      stats: {
        totalOrdonnances,
        totalDelivrees,
        totalEnAttente,
      },
    });

  } catch (error) {
    console.error("Erreur getStatsOrdonnances:", error);
    res.status(500).json({ message: "Erreur serveur", detail: error.message });
  }
};

// ✅ Commandes récentes (ordonnances triées par date décroissante)
export const getCommandesRecentes = async (req, res) => {
  try {
    const { limit = 10, mois, annee } = req.query;

    const where = {
      destinataire: "pharmacie",
      type:         "ordonnance",
    };

    // ✅ Filtre par mois/année si fourni
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      const fin   = new Date(parseInt(annee), parseInt(mois),     1);
      where.createdAt = { [Op.gte]: debut, [Op.lt]: fin };
    }

    const commandes = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]], // ✅ plus récente en premier
      limit: parseInt(limit),
    });

    res.json(commandes);
  } catch (error) {
    console.error("Erreur getCommandesRecentes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "prenom", "nom"],
      order: [["prenom", "ASC"]],
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

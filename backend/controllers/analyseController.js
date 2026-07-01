// controllers/analyseController.js
import Analyse from "../models/Analyse.js";
import Symptome from "../models/Symptome.js";
import Patients from "../models/Patients.js";

// ─── Calcul du score de risque ────────────────────────────────────────────
const POIDS_SEVERITE = {
  critique: 1.0,
  eleve:    0.7,
  modere:   0.4,
  faible:   0.1,
};

function calculerScoreRisque(symptomes) {
  if (!symptomes || symptomes.length === 0) return 0;
  const total = symptomes.reduce((acc, s) => {
    const poids   = POIDS_SEVERITE[s.severite] || 0.1;
    const confiance = parseFloat(s.confiance) || 1.0;
    return acc + poids * confiance;
  }, 0);
  return Math.min(parseFloat((total / symptomes.length).toFixed(3)), 1.0);
}

// ─── Décision médicale selon le score ────────────────────────────────────
function determinerDecision(scoreRisque) {
  if (scoreRisque >= 0.8) {
    return {
      typePatient: "Urgence",
      messageDecision: "🚨 Risque élevé — transfert en urgence recommandé.",
    };
  }
  if (scoreRisque >= 0.5) {
    return {
      typePatient: "Hospitalisé",
      messageDecision: "⚠️ Surveillance renforcée recommandée.",
    };
  }
  return {
    typePatient: "Hospitalisé", // on garde hospitalisé, pas de downgrade auto
    messageDecision: "✅ État stable — suivi standard.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/analyses/scan
// Reçoit une analyse depuis Flutter et la persiste
// ═══════════════════════════════════════════════════════════════════════════
export const creerAnalyseScan = async (req, res) => {
  const { patientId, source = "questionnaire", symptomes } = req.body;

  // ── Validation ────────────────────────────────────────────────────────
  if (!patientId) {
    return res.status(400).json({ message: "patientId est requis." });
  }
  if (!Array.isArray(symptomes) || symptomes.length === 0) {
    return res.status(400).json({ message: "Au moins un symptôme est requis." });
  }

  try {
    // ── Vérifier que le patient existe ────────────────────────────────
    const patient = await Patients.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient introuvable." });
    }

    // ── Calcul du score de risque ─────────────────────────────────────
    const scoreRisque = calculerScoreRisque(symptomes);
    const { typePatient, messageDecision } = determinerDecision(scoreRisque);
    const ancienType = patient.typePatient;

    // ── Créer l'analyse ───────────────────────────────────────────────
    const analyse = await Analyse.create({
      patientId,
      source,
      scoreRisque,
      statut: "en_attente",
    });

    // ── Insérer les symptômes en masse ────────────────────────────────
    const symptomesAAjouter = symptomes.map((s) => ({
      analyseId: analyse.id,
      type:      s.type      || "inconnu",
      valeur:    s.valeur    || "",
      severite:  s.severite  || "faible",
      source:    s.source    || "questionnaire",
      confiance: parseFloat(s.confiance) || 1.0,
    }));
    await Symptome.bulkCreate(symptomesAAjouter);

    // ── Mise à jour du typePatient si le risque est plus grave ─────────
    const PRIORITE = { Externe: 0, Hospitalisé: 1, Urgence: 2 };
    if (PRIORITE[typePatient] > PRIORITE[ancienType]) {
      await patient.update({ typePatient });
    }

    return res.status(201).json({
      analyseId:       analyse.id,
      statut:          analyse.statut,
      scoreRisque,
      typePatient:     patient.typePatient, // valeur après mise à jour éventuelle
      ancienType,
      messageDecision,
    });

  } catch (err) {
    console.error("[analyseController.creerAnalyseScan]", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/analyses
// Liste toutes les analyses avec leurs symptômes (pour React)
// ═══════════════════════════════════════════════════════════════════════════
export const getAnalyses = async (req, res) => {
  const { page = 1, limit = 20, patientId, statut } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (patientId) where.patientId = parseInt(patientId);
  if (statut)    where.statut    = statut;

  try {
    const { count, rows } = await Analyse.findAndCountAll({
      where,
      include: [
        {
          model: Symptome,
          as: "symptomes",
          attributes: ["id", "type", "valeur", "severite", "source", "confiance"],
        },
        {
          model: Patients,
          as: "patient",
          attributes: ["id", "nom", "prenom", "typePatient", "groupeSanguin"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      total:    count,
      page:     parseInt(page),
      analyses: rows,
    });
  } catch (err) {
    console.error("[analyseController.getAnalyses]", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/analyses/:id
// Détail d'une analyse avec tous ses symptômes
// ═══════════════════════════════════════════════════════════════════════════
export const getAnalyseById = async (req, res) => {
  try {
    const analyse = await Analyse.findByPk(req.params.id, {
      include: [
        { model: Symptome, as: "symptomes" },
        {
          model: Patients,
          as: "patient",
          attributes: ["id", "nom", "prenom", "typePatient", "groupeSanguin", "telephone"],
        },
      ],
    });

    if (!analyse) {
      return res.status(404).json({ message: "Analyse introuvable." });
    }

    return res.json(analyse);
  } catch (err) {
    console.error("[analyseController.getAnalyseById]", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/GET/suivi/:patientId
// Enrichit les suivis existants avec les analyses Flutter
// (Surcharge de l'endpoint existant dans votre projet)
// ═══════════════════════════════════════════════════════════════════════════
export const getSuiviAvecAnalyses = async (req, res) => {
  const { patientId } = req.params;
  try {
    // Récupérer les analyses Flutter du patient
    const analyses = await Analyse.findAll({
      where: { patientId },
      include: [
        {
          model: Symptome,
          as: "symptomes",
          attributes: ["type", "valeur", "severite", "source", "confiance"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(analyses);
  } catch (err) {
    console.error("[analyseController.getSuiviAvecAnalyses]", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/analyses/:id/valider
// Valider ou archiver une analyse (depuis React)
// ═══════════════════════════════════════════════════════════════════════════
export const validerAnalyse = async (req, res) => {
  const { statut } = req.body; // 'validee' ou 'archivee'
  if (!["validee", "archivee"].includes(statut)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const analyse = await Analyse.findByPk(req.params.id);
    if (!analyse) {
      return res.status(404).json({ message: "Analyse introuvable." });
    }
    await analyse.update({ statut });
    return res.json({ message: `Analyse ${statut} avec succès.`, analyse });
  } catch (err) {
    console.error("[analyseController.validerAnalyse]", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

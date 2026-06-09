// routes/room.js
import express from "express";
import sequelize from "../config/database.js";
import Chambre from "../models/Chambre.js";
import Patients from "../models/Patients.js";
import User from "../models/Users.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";
import constants from "../config/constants.js"; // ← clés JWT centralisées

const router = express.Router();

// ─────────────────────────────────────────────
// MIDDLEWARE : vérifier chambre active avant token vidéo
// ─────────────────────────────────────────────
const checkRoomAccess = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: "patientId requis" });
    }

    const patient = await Patients.findByPk(patientId, {
      include: [{ model: Chambre, as: "chambre", required: false }]
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient introuvable" });
    }
    if (!patient.chambreId || !patient.chambre) {
      return res.status(403).json({
        error: "ROOM_REQUIRED",
        message: "Ce patient n'a pas de chambre assignée. Appel vidéo non autorisé."
      });
    }

    const chambre = patient.chambre;
    if (chambre.occupe <= 0 || chambre.occupe > chambre.capacite) {
      return res.status(403).json({
        error: "ROOM_INACTIVE",
        message: `La chambre ${chambre.numero} n'est pas dans un état valide.`
      });
    }

    req.videoSession = { patient, chambre };
    next();
  } catch (error) {
    console.error("[checkRoomAccess]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
};

// ════════════════════════════════════════════════════════
// ⚠️  ORDRE CRITIQUE : routes spécifiques AVANT /:id
// ════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /api/rooms
// Liste toutes les chambres avec leurs patients
// ─────────────────────────────────────────────
router.get("/", verifyToken, async (req, res) => {
  try {
    const chambres = await Chambre.findAll({
      include: [
        {
          model: Patients,
          as: "patients",
          attributes: ["id", "nom", "prenom", "typePatient", "groupeSanguin"],
          include: [
            { model: User, as: "medecin", attributes: ["id", "nom", "prenom"] }
          ]
        }
      ],
      order: [["numero", "ASC"]]
    });
    res.json({ success: true, data: chambres });
  } catch (error) {
    console.error("[GET /rooms]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// ✅ EN PREMIER — GET /api/rooms/numero/:numero
// → DOIT être avant GET /:id
// ─────────────────────────────────────────────
router.get("/numero/:numero", verifyToken, async (req, res) => {
  try {
    const chambre = await Chambre.findOne({
      where: { numero: req.params.numero },
      include: [
        {
          model: Patients,
          as: "patients",
          attributes: ["id", "nom", "prenom", "typePatient", "groupeSanguin", "chambreId"],
          include: [
            { model: User, as: "medecin", attributes: ["id", "nom", "prenom"] }
          ]
        }
      ]
    });

    if (!chambre) {
      return res.status(404).json({
        error: `Chambre numéro ${req.params.numero} introuvable`
      });
    }

    res.json({ success: true, data: chambre });
  } catch (error) {
    console.error("[GET /rooms/numero/:numero]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// ✅ EN SECOND — GET /api/rooms/:id
// ─────────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const chambre = await Chambre.findByPk(req.params.id, {
      include: [
        {
          model: Patients,
          as: "patients",
          include: [
            { model: User, as: "medecin", attributes: ["id", "nom", "prenom"] }
          ]
        }
      ]
    });

    if (!chambre) {
      return res.status(404).json({ error: "Chambre introuvable" });
    }
    res.json({ success: true, data: chambre });
  } catch (error) {
    console.error("[GET /rooms/:id]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms — Créer une chambre
// ─────────────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
  try {
    const { numero, capacite } = req.body;
    if (!numero || !capacite) {
      return res.status(400).json({ error: "numero et capacite sont requis" });
    }
    const existe = await Chambre.findOne({ where: { numero } });
    if (existe) {
      return res.status(409).json({ error: `La chambre numéro ${numero} existe déjà` });
    }
    const chambre = await Chambre.create({ numero, capacite, occupe: 0 });
    res.status(201).json({ success: true, data: chambre });
  } catch (error) {
    console.error("[POST /rooms]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// ✅ POST /api/rooms/video/session
// Génère le token vidéo si chambre valide
// ─────────────────────────────────────────────
router.post("/video/session", verifyToken, checkRoomAccess, (req, res) => {
  const { patient, chambre } = req.videoSession;

  const videoToken = jwt.sign(
    {
      patientId:     patient.id,
      chambreId:     chambre.id,
      numeroChambre: chambre.numero,
      role:          "patient"
    },
    constants.JWT_VIDEO_SECRET,      // ← plus de process.env
    { expiresIn: constants.JWT_VIDEO_EXPIRES_IN }
  );

  res.json({
    success:       true,
    token:         videoToken,
    numeroChambre: chambre.numero,
    patientNom:    `${patient.prenom} ${patient.nom}`
  });
});

// ─────────────────────────────────────────────
// PUT /api/rooms/:id — Modifier une chambre
// ─────────────────────────────────────────────
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const chambre = await Chambre.findByPk(req.params.id);
    if (!chambre) {
      return res.status(404).json({ error: "Chambre introuvable" });
    }
    const { numero, capacite, occupe } = req.body;
    const newCapacite = capacite ?? chambre.capacite;
    const newOccupe   = occupe   ?? chambre.occupe;
    if (newOccupe > newCapacite) {
      return res.status(400).json({
        error: "Le nombre d'occupants ne peut pas dépasser la capacité"
      });
    }
    await chambre.update({ numero, capacite: newCapacite, occupe: newOccupe });
    res.json({ success: true, data: chambre });
  } catch (error) {
    console.error("[PUT /rooms/:id]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/rooms/:id — Supprimer si vide
// ─────────────────────────────────────────────
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const chambre = await Chambre.findByPk(req.params.id, {
      include: [{ model: Patients, as: "patients" }]
    });
    if (!chambre) {
      return res.status(404).json({ error: "Chambre introuvable" });
    }
    if (chambre.patients && chambre.patients.length > 0) {
      return res.status(409).json({
        error: "Impossible de supprimer une chambre avec des patients assignés"
      });
    }
    await chambre.destroy();
    res.json({ success: true, message: "Chambre supprimée avec succès" });
  } catch (error) {
    console.error("[DELETE /rooms/:id]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/rooms/:id/assign/:patientId
// Assigner un patient à une chambre
// ─────────────────────────────────────────────
router.patch("/:id/assign/:patientId", verifyToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const chambre = await Chambre.findByPk(req.params.id, { transaction: t });
    const patient = await Patients.findByPk(req.params.patientId, { transaction: t });

    if (!chambre) {
      await t.rollback();
      return res.status(404).json({ error: "Chambre introuvable" });
    }
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ error: "Patient introuvable" });
    }

    if (chambre.occupe >= chambre.capacite) {
      await t.rollback();
      return res.status(409).json({
        error: "ROOM_FULL",
        message: `La chambre ${chambre.numero} est complète (${chambre.occupe}/${chambre.capacite})`
      });
    }

    // Libérer l'ancienne chambre si le patient en avait une
    if (patient.chambreId && patient.chambreId !== chambre.id) {
      await Chambre.decrement("occupe", {
        where: { id: patient.chambreId },
        transaction: t
      });
    }

    await patient.update({ chambreId: chambre.id }, { transaction: t });
    await chambre.increment("occupe", { transaction: t });
    await chambre.reload({ transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Patient assigné à la chambre ${chambre.numero}`,
      data: { chambre, patient }
    });
  } catch (error) {
    await t.rollback();
    console.error("[PATCH assign]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/rooms/:id/release/:patientId
// Libérer un patient d'une chambre
// ─────────────────────────────────────────────
router.patch("/:id/release/:patientId", verifyToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const chambre = await Chambre.findByPk(req.params.id, { transaction: t });
    const patient = await Patients.findByPk(req.params.patientId, { transaction: t });

    if (!chambre) {
      await t.rollback();
      return res.status(404).json({ error: "Chambre introuvable" });
    }
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ error: "Patient introuvable" });
    }

    if (patient.chambreId !== chambre.id) {
      await t.rollback();
      return res.status(400).json({
        error: "Ce patient n'est pas assigné à cette chambre"
      });
    }

    await patient.update({ chambreId: null }, { transaction: t });
    if (chambre.occupe > 0) {
      await chambre.decrement("occupe", { transaction: t });
    }
    await t.commit();

    res.json({
      success: true,
      message: `Patient libéré de la chambre ${chambre.numero}`
    });
  } catch (error) {
    await t.rollback();
    console.error("[PATCH release]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
});

export default router;
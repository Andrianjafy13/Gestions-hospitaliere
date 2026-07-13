import { Op } from "sequelize";
import sequelize from "../config/database.js";
import User from "../models/Users.js";
import Message from "../models/Message.js";
import { getIO } from "../socket.js";

/**
 * GET /api/public/statsPublic
 */
export const getStatsPublic = async (req, res) => {
  try {
    const rows = await User.findAll({
      attributes: [
        "role",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        role: {
          [Op.in]: [
            "medecin",
            "infirmier",
            "receptionniste",
            "pharmacien",
          ],
        },
      },
      group: ["role"],
      raw: true,
    });

    const result = {
      medecins: { total: 0, disponibles: 0 },
      infirmiers: { total: 0, disponibles: 0 },
      receptionniste: { total: 0, disponibles: 0 },
      pharmaciens: { total: 0, disponibles: 0 },
    };

    const roleMap = {
      medecin: "medecins",
      infirmier: "infirmiers",
      receptionniste: "receptionniste",
      pharmacien: "pharmaciens",
    };

    rows.forEach((row) => {
      const key = roleMap[row.role];

      if (!key) return;

      const count = parseInt(row.count);

      result[key].total += count;

      if (row.disponibilite === "available") {
        result[key].disponibles += count;
      }
    });

    const totalPersonnel =
      result.medecins.total +
      result.infirmiers.total +
      result.receptionniste.total +
      result.pharmaciens.total;
    res.status(200).json({
      success: true,
      data: {
        ...result,
        totalPersonnel,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

/**
 * GET /api/public/annuaire
 */
export const getAnnuaire = async (req, res) => {
  try {
    const {
      role,
      search,
      dispo,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {
      role: {
        [Op.ne]: "admin",
      },
    };

    if (role && role !== "all") {
      where.role = role;
    }

    if (dispo) {
      where.disponibilite = dispo;
    }

    if (search) {
      where[Op.or] = [
        {
          nom: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          prenom: {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      attributes: [
        "id",
        "nom",
        "prenom",
        "email",
        "role",
        "specialite",
        "photoProfil",
      ],
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["nom", "ASC"],
        ["prenom", "ASC"],
      ],
    });

    const professionals = rows.map((user) => ({
      ...user.toJSON(),
      initiales: `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase(),
      photoUrl: user.photoProfil
        ? `${process.env.BASE_URL || "http://localhost:5000"}${user.photoProfil}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: professionals,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'annuaire",
      error: error.message,
    });
  }
};

/**
 * GET /api/public/annuaire/:id
 */
export const getProfessionnelById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      attributes: [
        "id",
        "nom",
        "prenom",
        "email",
        "role",
        "specialite",
        "photoProfil",
      ],
      where: {
        id,
        role: {
          [Op.ne]: "admin",
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professionnel introuvable",
      });
    }

    const data = user.toJSON();

    res.status(200).json({
      success: true,
      data: {
        ...data,
        initiales:
          `${data.prenom?.[0] || ""}${data.nom?.[0] || ""}`.toUpperCase(),
        photoUrl: data.photoProfil
          ? `${process.env.BASE_URL || "http://localhost:5000"}${data.photoProfil}`
          : null,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

/**
 * POST /api/public/annuaire/:id/call
 */
export const callProfessionnel = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      patientNom = "Patient",
      motif = "Consultation",
    } = req.body;

    const user = await User.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professionnel introuvable",
      });
    }

    const callId = `CALL-${Date.now()}-${user.id}`;

    return res.status(200).json({
      success: true,
      message: `Appel initié avec ${user.prenom} ${user.nom}`,
      data: {
        callId,
        patientNom,
        motif,
        professionnel: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
        },
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

/**
 * POST /api/public/annuaire/:id/message
 */
export const envoyerMessageReceptionniste = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, message } = req.body;

    const nomVisiteur = String(nom || "").trim();
    const telephoneVisiteur = String(telephone || "").trim();
    const contenuMessage = String(message || "").trim();

    if (!nomVisiteur || !telephoneVisiteur || !contenuMessage) {
      return res.status(400).json({
        success: false,
        message: "Nom, téléphone et message sont obligatoires.",
      });
    }

    const receptionniste = await User.findOne({
      where: {
        id,
        role: "receptionniste",
      },
      attributes: ["id", "nom", "prenom", "role"],
    });

    if (!receptionniste) {
      return res.status(404).json({
        success: false,
        message: "Réceptionniste introuvable.",
      });
    }

    const contenu = [
      `Message public de ${nomVisiteur}`,
      `Téléphone : ${telephoneVisiteur}`,
      "",
      contenuMessage,
    ].join("\n");

    const publicMessage = await Message.create({
      expediteurId: null,
      destinataireId: receptionniste.id,
      contenu,
      lu: false,
    });

    const payload = {
      id: publicMessage.id,
      contenu: publicMessage.contenu,
      expediteurId: null,
      destinataireId: receptionniste.id,
      createdAt: publicMessage.createdAt,
      lu: false,
      modifie: false,
      supprime: false,
      source: "public",
      visiteur: {
        nom: nomVisiteur,
        telephone: telephoneVisiteur,
      },
    };

    try {
      getIO().to(`user_${receptionniste.id}`).emit("nouveauMessage", payload);
    } catch (socketError) {
      console.warn("Notification socket public non envoyée:", socketError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Message envoyé à la réceptionniste.",
      data: payload,
    });
  } catch (error) {
    console.error("envoyerMessageReceptionniste:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

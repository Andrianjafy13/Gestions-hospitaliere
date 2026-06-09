import { Op } from "sequelize";
import sequelize from "../config/database.js";
import User from "../models/Users.js";

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
        "role",
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
        "role",
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
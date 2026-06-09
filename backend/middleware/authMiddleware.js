// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import constants from "../config/constants.js"; // ← import de la config

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ error: "Token vide" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, constants.JWT_SECRET); // ← plus de process.env
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expiré",
          message: "Session expirée, veuillez vous reconnecter."
        });
      }
      return res.status(403).json({
        error: "Token invalide",
        message: jwtError.message
      });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "nom", "prenom", "email", "role"]
    });

    if (!user) {
      return res.status(403).json({ error: "Utilisateur introuvable" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("[verifyToken]", error);
    res.status(500).json({ error: "Erreur serveur", detail: error.message });
  }
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Accès interdit",
        message: `Rôle requis : ${roles.join(" ou ")}`
      });
    }
    next();
  };
};
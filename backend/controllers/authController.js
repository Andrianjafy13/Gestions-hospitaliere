import User   from "../models/Users.js";
import bcrypt from "bcrypt";
import jwt    from "jsonwebtoken";
import constants from "../config/constants.js";

// ── Inscription ──────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, specialite } = req.body;

    if (!nom || !prenom || !email || !password || !role || !specialite) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires"
      });
    }

    const existUser = await User.findOne({ where: { email } });
    if (existUser) {
      return res.status(400).json({ message: "Cet email existe déjà" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ nom, prenom, email, password: hash, role, specialite });

    return res.status(201).json({
      message: "Utilisateur bien inscrit",
      user: {
        id:     user.id,
        nom:    user.nom,
        prenom: user.prenom,
        email:  user.email,
        role:   user.role,
        specialite: user.specialite,
      }
    });

  } catch (error) {
    console.error("register :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── Connexion ────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // const token = jwt.sign(
    //   { id: user.id, role: user.role },
    //   "SECRET_KEY",
    //   { expiresIn: "1d" }
    // );

    const token = jwt.sign(
      { id: user.id, role: user.role },
      constants.JWT_SECRET,        // ← même clé que verifyToken
      { expiresIn: constants.JWT_EXPIRES_IN }
    );
  

    // ✅ Construire l'URL complète de la photo si elle existe
    const photoUrl = user.photoProfil
      ? `${req.protocol}://${req.get("host")}${user.photoProfil}`
      : null;

    return res.json({
      message: "Connexion réussie",
      token,
      user: {
        id:          user.id,
        nom:         user.nom,        // ✅ corrigé
        prenom:      user.prenom,
        role:        user.role,
        specialite : user.specialite,
        photoProfil: photoUrl,        // ✅ ajouté
      }
    });

  } catch (error) {
    console.error("login :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
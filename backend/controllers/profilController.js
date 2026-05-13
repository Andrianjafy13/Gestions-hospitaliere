// controllers/profilController.js
import User   from "../models/Users.js";
import multer from "multer";
import path   from "path";
import fs     from "fs";

// ── Multer config ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dossier = "uploads/profils/";
    if (!fs.existsSync(dossier)) fs.mkdirSync(dossier, { recursive: true });
    cb(null, dossier);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profil_${req.params.userId}_${Date.now()}${ext}`);
  },
});

const filtreImage = (req, file, cb) => {
  ["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("JPG et PNG uniquement."), false);
};

export const upload = multer({
  storage,
  fileFilter: filtreImage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── GET — Récupérer le profil complet ─────────────────────
export const getProfil = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: [
        "id", "nom", "prenom", "email", "role",
        "photoProfil", // ✅ doit exister dans le modèle
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    return res.status(200).json({
      id:          user.id,
      nom:         user.nom,
      prenom:      user.prenom,
      email:       user.email,
      role:        user.role,
      // ✅ Construire l'URL complète ou null
      photoProfil: user.photoProfil
        ? `http://localhost:5000${user.photoProfil}`
        : null,
    });

  } catch (err) {
    console.error("getProfil:", err.message);
    return res.status(500).json({ message: "Erreur serveur.", detail: err.message });
  }
};

// ── PUT — Mettre à jour la photo ──────────────────────────
export const updatePhotoProfil = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // ✅ Supprimer l'ancienne photo du disque
    if (user.photoProfil) {
      const ancien = path.join(process.cwd(), user.photoProfil);
      if (fs.existsSync(ancien)) fs.unlinkSync(ancien);
    }

    // ✅ Sauvegarder le nouveau chemin
    const urlRelative = `/uploads/profils/${req.file.filename}`;
    user.photoProfil  = urlRelative;
    await user.save();

    return res.status(200).json({
      message:     "Photo mise à jour.",
      photoProfil: `http://localhost:5000${urlRelative}`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur.", detail: err.message });
  }
};

import User   from "../models/Users.js";
import multer from "multer";
import path   from "path";
import fs     from "fs";

// ── Configuration Multer ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dossier = "uploads/profils/";
    if (!fs.existsSync(dossier)) fs.mkdirSync(dossier, { recursive: true });
    cb(null, dossier);
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const nomFichier = `profil_${req.params.userId}_${Date.now()}${ext}`;
    cb(null, nomFichier);
  },
});

const filtreImage = (req, file, cb) => {
  const typesAcceptes = ["image/jpeg", "image/jpg", "image/png"];
  if (typesAcceptes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté. JPG et PNG uniquement."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter: filtreImage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ── Mettre à jour la photo ────────────────────────────────
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

    // ✅ Supprimer l'ancienne photo si elle existe
    if (user.photoProfil) {
      const ancienChemin = path.join("uploads/profils", path.basename(user.photoProfil));
      if (fs.existsSync(ancienChemin)) fs.unlinkSync(ancienChemin);
    }

    // ✅ Sauvegarder le chemin de la nouvelle photo
    const urlPhoto = `/uploads/profils/${req.file.filename}`;
    user.photoProfil = urlPhoto;
    await user.save();

    return res.status(200).json({
      message:     "Photo mise à jour avec succès.",
      photoProfil: urlPhoto,
    });

  } catch (err) {
    console.error("updatePhotoProfil:", err);
    return res.status(500).json({ message: "Erreur serveur.", detail: err.message });
  }
};
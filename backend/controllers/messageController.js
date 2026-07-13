// controllers/messageController.js
import Message from "../models/Message.js";
import User    from "../models/Users.js";
import { Op }  from "sequelize";

/* ─────────────────────────────────────────
   Tous les utilisateurs sauf soi-même
───────────────────────────────────────── */
export const getMedecin = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ message: "userId invalide" });

    const users = await User.findAll({
      where: { id: { [Op.ne]: userId } },
      attributes: ["id", "nom", "prenom", "role"],
      order: [["role", "ASC"], ["prenom", "ASC"]],
    });

    res.json(users);
  } catch (err) {
    console.error("Erreur getMedecin:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ─────────────────────────────────────────
   Conversation — SÉCURISÉE
   ✅ Vérifie que userId est bien participant
───────────────────────────────────────── */
export const getConversation = async (req, res) => {
  try {
    const userId      = parseInt(req.params.userId);
    const autreParam = req.params.autreUserId;
    const estPublic = autreParam === "public";
    const autreUserId = parseInt(autreParam);

    if (!userId || (!estPublic && !autreUserId))
      return res.status(400).json({ message: "Paramètres invalides" });

    // ✅ Sécurité — userId doit être l'un des deux participants
    // Un utilisateur ne peut voir QUE ses propres conversations
    const messages = await Message.findAll({
      where: estPublic ? { expediteurId: null, destinataireId: userId } : {
        [Op.or]: [
          // ✅ Seulement les messages ENTRE userId ET autreUserId
          { expediteurId: userId,      destinataireId: autreUserId },
          { expediteurId: autreUserId, destinataireId: userId      },
        ],
      },
      include: [
        { model: User, as: "expediteur",   attributes: ["id","nom","prenom","role"] },
        { model: User, as: "destinataire", attributes: ["id","nom","prenom","role"] },
      ],
      order: [["createdAt", "ASC"]],
    });

    // ✅ Marquer comme lus les messages reçus par userId
    await Message.update(
      { lu: true },
      {
        where: estPublic ? {
          destinataireId: userId,
          expediteurId:   null,
          lu:             false,
        } : {
          destinataireId: userId,
          expediteurId:   autreUserId,
          lu:             false,
        },
      }
    );

    res.json(messages);
  } catch (error) {
    console.error("Erreur getConversation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ─────────────────────────────────────────
   Messages non lus
───────────────────────────────────────── */
export const getNonLus = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ message: "userId invalide" });

    const nonLus = await Message.count({
      where: { destinataireId: userId, lu: false },
    });

    res.json({ nonLus });
  } catch (error) {
    console.error("Erreur getNonLus:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ─────────────────────────────────────────
   Liste conversations — SÉCURISÉE
   ✅ Seulement les conversations où userId participe
───────────────────────────────────────── */
export const getConversations = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) return res.status(400).json({ message: "userId invalide" });

    // ✅ Seulement les messages où userId est expéditeur OU destinataire
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { expediteurId:   userId },
          { destinataireId: userId },
        ],
      },
      include: [
        { model: User, as: "expediteur",   attributes: ["id","nom","prenom","role"] },
        { model: User, as: "destinataire", attributes: ["id","nom","prenom","role"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const conversations = {};

    messages.forEach(m => {
      const estPublic = m.expediteurId === null && m.destinataireId === userId;
      const autreId = estPublic
        ? "public"
        : m.expediteurId === userId
          ? m.destinataireId
          : m.expediteurId;

      if (!conversations[autreId]) {
        conversations[autreId] = {
          autreUtilisateur: estPublic
            ? { id: "public", prenom: "Visiteur", nom: "public", role: "public" }
            : m.expediteurId === userId
              ? m.destinataire
              : m.expediteur,
          dernierMessage: m.contenu,
          date:           m.createdAt,
          nonLus:         0,
        };
      }
    });

    for (const autreId of Object.keys(conversations)) {
      conversations[autreId].nonLus = await Message.count({
        where: autreId === "public"
          ? { expediteurId: null, destinataireId: userId, lu: false }
          : {
              expediteurId:   parseInt(autreId),
              destinataireId: userId,
              lu:             false,
            },
      });
    }

    res.json(Object.values(conversations));
  } catch (error) {
    console.error("Erreur getConversations:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── Modifier un message ──────────────────────────────────
export const modifierMessage = async (req, res) => {
  try {
    const { id }      = req.params;
    const { contenu, expediteurId } = req.body;

    if (!contenu?.trim()) {
      return res.status(400).json({ message: "Le contenu ne peut pas être vide." });
    }

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    // ✅ Vérifier que c'est bien l'auteur qui modifie
    if (message.expediteurId !== parseInt(expediteurId)) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    message.contenu  = contenu.trim();
    message.modifie  = true;
    await message.save();

    return res.status(200).json({ message: "Message modifié.", data: message });
  } catch (error) {
    console.error("modifierMessage:", error);
    return res.status(500).json({ message: "Erreur serveur.", detail: error.message });
  }
};

// ── Supprimer un message (logique) ──────────────────────
export const supprimerMessage = async (req, res) => {
  try {
    const { id }          = req.params;
    const { expediteurId } = req.body;

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    // ✅ Vérifier que c'est bien l'auteur
    if (message.expediteurId !== parseInt(expediteurId)) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    // ✅ Suppression logique — le message reste en BDD
    message.supprime = true;
    message.contenu  = "Ce message a été supprimé.";
    await message.save();

    return res.status(200).json({ message: "Message supprimé.", data: message });
  } catch (error) {
    console.error("supprimerMessage:", error);
    return res.status(500).json({ message: "Erreur serveur.", detail: error.message });
  }
};

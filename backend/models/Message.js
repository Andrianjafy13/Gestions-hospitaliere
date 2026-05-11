// models/Message.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./Users.js";

const Message = sequelize.define("Message", {
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  supprime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // ✅ Mention "Modifié"
  modifie: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true, // ✅ createdAt = timestamp du message
});

// ✅ Expéditeur
Message.belongsTo(User, { foreignKey: "expediteurId", as: "expediteur" });
User.hasMany(Message,   { foreignKey: "expediteurId", as: "messagesEnvoyes" });

// ✅ Destinataire
Message.belongsTo(User, { foreignKey: "destinataireId", as: "destinataire" });
User.hasMany(Message,   { foreignKey: "destinataireId", as: "messagesRecus" });

export default Message;
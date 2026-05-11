// Migration — table Notifications
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Consultations from "./Consultation.js";

const Notification = sequelize.define("Notification", {
  
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  type: {
    type: DataTypes.STRING,
    allowNull: false
  },

  destinataire: {
    type: DataTypes.STRING,
    allowNull: false
  },

  consultationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  patientNom: {
    type: DataTypes.STRING,
    allowNull: true
  },

  medecinNom: {
    type: DataTypes.STRING,
    allowNull: true
  },

  traitement: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  vu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  tableName: "Notifications",
  timestamps: true // 🔹 createdAt & updatedAt automatique
});

Notification.belongsTo(Consultations, {
    foreignKey: "consultationId",
    as: "consultation"
  });

export default Notification;
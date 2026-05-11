import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../config/database.js";
import User from "./Users.js";
import Patients from "./Patients.js";

const RendezVous = sequelize.define("RendezVous", {
  dateRendezVous: {
    type: DataTypes.DATE,
    allowNull: false
  },
  heureRendezVous: {
    type: DataTypes.TIME, // ✅ nouveau champ
    allowNull: true,
  },
  typeConsultation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priorite: {
    type: DataTypes.STRING,
    allowNull: true
  },
  motifRendezVous: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vu: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  statut: {
    type: DataTypes.ENUM("En attente", "Validé", "Annulé"),
    defaultValue: "En attente", // ✅ valeur par défaut obligatoire
    allowNull: false,
  },
}, {
  tableName: "rendezVous",
  timestamps: true
});

RendezVous.belongsTo(User, {
  foreignKey: "medecinId",
  as: "medecin"
});
  
RendezVous.belongsTo(Patients, {
    foreignKey: "patientId",
    as: "patients"
  });

export default RendezVous;
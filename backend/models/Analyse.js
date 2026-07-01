// models/Analyse.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Patients from "./Patients.js";

const Analyse = sequelize.define("Analyse", {
  source: {
    type: DataTypes.ENUM("questionnaire", "capteur_camera", "capteur_micro", "mixte"),
    defaultValue: "questionnaire",
  },
  statut: {
    type: DataTypes.ENUM("en_attente", "validee", "archivee"),
    defaultValue: "en_attente",
  },
  scoreRisque: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
}, {
  tableName: "analyses",
  timestamps: true,
});

// ─── Relation Patients → Analyses ──────────────────────────────────────────
Patients.hasMany(Analyse, { foreignKey: "patientId", as: "analyses" });
Analyse.belongsTo(Patients, { foreignKey: "patientId", as: "patient" });

export default Analyse;

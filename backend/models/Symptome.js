// models/Symptome.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Analyse from "./Analyse.js";

const Symptome = sequelize.define("Symptome", {
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // ex: 'temperature', 'tension', 'toux', 'etat_general', 'autres'
  },
  valeur: {
    type: DataTypes.TEXT,
    // ex: 'elevee', 'seche_persistante', texte libre
  },
  severite: {
    type: DataTypes.ENUM("faible", "modere", "eleve", "critique"),
    defaultValue: "faible",
  },
  source: {
    type: DataTypes.ENUM("questionnaire", "capteur"),
    defaultValue: "questionnaire",
  },
  confiance: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    // Score de confiance du capteur (0.0 à 1.0)
  },
}, {
  tableName: "symptomes",
  timestamps: true,
});

// ─── Relation Analyse → Symptomes ──────────────────────────────────────────
Analyse.hasMany(Symptome, { foreignKey: "analyseId", as: "symptomes" });
Symptome.belongsTo(Analyse, { foreignKey: "analyseId", as: "analyse" });

export default Symptome;

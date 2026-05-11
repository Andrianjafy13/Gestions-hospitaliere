import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Patients from "./Patients.js";

const SuiviPatient = sequelize.define("SuiviPatient", {
  temperature: {
    type: DataTypes.FLOAT,   // ✅ FLOAT pour 36.5, 37.0, 38.5
    allowNull: false,
  },
  tension: {
    type: DataTypes.STRING,  // ✅ STRING pour "12/8" ou "120/80"
    allowNull: false,
  },
  symptome: {
    type: DataTypes.TEXT,    // ✅ TEXT pour texte long
    allowNull: true,
  },
  dateSuivi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "suivi_patients",
  timestamps: true,
});

Patients.hasMany(SuiviPatient, { foreignKey: "patientId", as: "suivis" });
SuiviPatient.belongsTo(Patients, { foreignKey: "patientId", as: "patient" });

export default SuiviPatient;
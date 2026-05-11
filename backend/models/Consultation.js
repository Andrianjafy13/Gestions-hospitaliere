import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Patients from "./Patients.js";
import User from "./Users.js";

const Consultations = sequelize.define("consultation", {
    motif: {
        type: DataTypes.STRING,
        allowNull: false
      },

    diagnostic: {
        type: DataTypes.STRING,
        allowNull: false
      },

    traitement: {
        type: DataTypes.STRING,
        allowNull: false
      },

    dateConsultation: {
        type: DataTypes.DATE,
        allowNull: false
      },
    
    heureConsultation: {
        type: DataTypes.TIME, // ✅ nouveau champ
        allowNull: true,
      },
    
});
Consultations.belongsTo(Patients, {
    foreignKey: "patientId",
    as : "patients"
});
Consultations.belongsTo(User, {
    foreignKey: "medecinId",
    as: "medecin"
});
export default Consultations;
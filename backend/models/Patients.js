import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./Users.js";
import Chambre from "./Chambre.js";

const Patients = sequelize.define("Patients", {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },

  prenom: {
    type: DataTypes.STRING,
    allowNull: false
  },

  dateNaissance: {
    type: DataTypes.DATEONLY, // 🔥 mieux
    allowNull: false
  },

  sexe: {
    type: DataTypes.ENUM("Masculin", "Féminin"),
    allowNull: false
  },

  adresse: {
    type: DataTypes.STRING
  },

  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  typePatient: {
    type: DataTypes.ENUM("Externe", "Hospitalisé", "Urgence"),
    allowNull: false
  },

  allergies: {
    type: DataTypes.STRING
  },

  groupeSanguin: {
    type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
  },

  observation: {
    type: DataTypes.TEXT
  },
  

  // 🔥 NOUVEAU
  chambreId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Chambre,
      key: "id"
    }
  },

  medecinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    }
  }

}, {
  tableName: "patients",
  timestamps: true
});


// ================= RELATIONS =================

// médecin
User.hasMany(Patients, {
  foreignKey: "medecinId",
  as: "patients"
});

Patients.belongsTo(User, {
  foreignKey: "medecinId",
  as: "medecin"
});

// 🔥 chambre
Chambre.hasMany(Patients, {
  foreignKey: "chambreId",
  as: "patients"
});

Patients.belongsTo(Chambre, {
  foreignKey: "chambreId",
  as: "chambre"
});

export default Patients;
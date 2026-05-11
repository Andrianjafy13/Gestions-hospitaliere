import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Medicaments = sequelize.define("Medicaments", {

  nomMedicament: {
    type: DataTypes.STRING,
    allowNull: false
  },

  categorie: {
    type: DataTypes.STRING,
    allowNull: false
  },

  forme: {
    type: DataTypes.STRING,
    allowNull: false
  },

  dosage: {
    type: DataTypes.STRING,
    allowNull: false
  },

  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  prix: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  dateExpiration: {
    type: DataTypes.DATEONLY, // ✅ mieux que DATE
    allowNull: false
  }

}, {
  timestamps: true
});

export default Medicaments;
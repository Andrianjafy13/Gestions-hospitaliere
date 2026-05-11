import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Chambre = sequelize.define("Chambre", {
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true 
  },

  capacite: {
    type: DataTypes.INTEGER, 
    allowNull: false
  },

  occupe: {
    type: DataTypes.INTEGER, 
    defaultValue: 0
  }

}, {
  timestamps: true
});
export default Chambre;
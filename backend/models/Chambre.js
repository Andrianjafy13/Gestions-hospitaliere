import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Chambre = sequelize.define("Chambre", {
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'unique_chambre_numero'  // ← nom fixe pour éviter la création d'index en double
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
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['numero'],
      name: 'unique_chambre_numero'  // ← même nom ici
    }
  ]
});
export default Chambre;
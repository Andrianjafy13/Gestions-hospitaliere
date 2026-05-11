import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./Users.js";

const Garde = sequelize.define("Garde", {

  typeGarde: {
    type: DataTypes.ENUM("matin", "soir", "nuit", "custom"),
    allowNull: false
  },

  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },

  heureFin: {
    type: DataTypes.TIME,
    allowNull: false
  },

  service: {
    type: DataTypes.STRING,
    allowNull: false
  },

  infirmierId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }

}, {
  timestamps: true
});

Garde.belongsTo(User, {
  foreignKey: "infirmierId",
  as: "infirmier"
});

export default Garde;
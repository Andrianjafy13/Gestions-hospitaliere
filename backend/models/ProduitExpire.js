import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProduitExpire = sequelize.define("ProduitExpire", {

  // Copie exacte des champs Medicaments
  medicamentId:  { type: DataTypes.INTEGER, allowNull: false },
  nomMedicament: { type: DataTypes.STRING,  allowNull: false },
  categorie:     { type: DataTypes.STRING,  allowNull: false },
  forme:         { type: DataTypes.STRING,  allowNull: false },
  dosage:        { type: DataTypes.STRING,  allowNull: false },
  stockAuRetrait:{ type: DataTypes.INTEGER, allowNull: false }, // stock au moment du retrait
  prix:          { type: DataTypes.INTEGER, allowNull: false },
  dateExpiration:{ type: DataTypes.DATEONLY,allowNull: false },

  // Traçabilité
  dateArchivage: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  raisonRetrait: {
    type: DataTypes.ENUM("expiration", "retrait_manuel"),
    defaultValue: "expiration",
  },

}, { timestamps: true });

export default ProduitExpire;
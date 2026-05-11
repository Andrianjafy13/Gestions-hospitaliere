import { Sequelize } from "sequelize";

const sequelize = new Sequelize("hopital", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false
});

export default sequelize;

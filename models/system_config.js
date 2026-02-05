const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  return sequelize.define("SystemConfig", {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
};

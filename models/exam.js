const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Exam', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: '期末',
    },
    examDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
    },
    seat: {
      type: DataTypes.STRING,
    },
    remark: {
      type: DataTypes.STRING,
    },
  });
};

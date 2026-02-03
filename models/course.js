const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
    },
    dayOfWeek: {
      type: DataTypes.INTEGER, // 1-7
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING, // '08:00'
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING, // '09:35'
      allowNull: false,
    },
    weeks: {
      type: DataTypes.STRING, // '1-16周'
    },
    color: {
      type: DataTypes.STRING, // '#E3F2FD'
    },
  });
};

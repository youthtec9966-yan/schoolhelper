const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Venue', {
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
      type: DataTypes.STRING, // 教室, 会议室, 体育馆
      defaultValue: '通用',
    },
    location: {
      type: DataTypes.STRING,
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING, // open, closed, maintenance
      defaultValue: 'open',
    },
    openHours: {
      type: DataTypes.STRING, // e.g. "08:00-22:00"
      defaultValue: '08:00-22:00',
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
  });
};

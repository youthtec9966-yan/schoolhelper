const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('VenueSlot', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slotDate: {
      type: DataTypes.STRING,
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
    status: {
      type: DataTypes.STRING,
      defaultValue: 'open',
    },
  });
};

const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('VenueBooking', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    openid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
    },
    userPhone: {
      type: DataTypes.STRING,
    },
    bookDate: {
      type: DataTypes.STRING, // YYYY-MM-DD
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING, // HH:mm
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING, // HH:mm
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING, // pending, approved, rejected, cancelled
      defaultValue: 'pending',
    },
  });
};

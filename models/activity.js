const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Activity", {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cover: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    organizer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 状态: 'recruiting'(报名中), 'ongoing'(进行中), 'ended'(已结束)
    status: {
      type: DataTypes.ENUM('recruiting', 'ongoing', 'ended'),
      defaultValue: 'recruiting'
    }
  });
};

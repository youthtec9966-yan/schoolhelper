const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Club", {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 类别: 艺术, 体育, 科技, 公益, etc.
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    president: {
      type: DataTypes.STRING, // 社长姓名
      allowNull: true
    }
  });
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Carousel", {
    // 图片地址
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 跳转链接 (可选)
    link: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 排序权重 (越大越靠前)
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 备注/标题
    title: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};
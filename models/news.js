const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("News", {
    // 类型: 'notice'(通知), 'news'(资讯), 'announcement'(公告)
    type: {
      type: DataTypes.ENUM('notice', 'news', 'announcement'),
      defaultValue: 'news'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT, // HTML or Markdown content
      allowNull: true
    },
    cover: {
      type: DataTypes.STRING,
      allowNull: true
    },
    readCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    publishDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
};

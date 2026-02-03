const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Comment", {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    authorName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authorAvatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};
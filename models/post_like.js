const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("PostLike", {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId']
      }
    ]
  });
};
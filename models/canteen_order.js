const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('CanteenOrder', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    openid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING, // 订餐人姓名
      allowNull: false,
    },
    dish: {
      type: DataTypes.STRING, // 简要描述（如 "红烧肉 x1, 米饭 x1"）
      allowNull: false,
    },
    items: {
      type: DataTypes.TEXT, // JSON string: [{id:1, name:'红烧肉', price:12, count:1}, ...]
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    diningTime: {
      type: DataTypes.STRING, // 就餐/取餐时间
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING, // 联系电话
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // pending, completed, cancelled
      defaultValue: 'pending',
    },
    remark: {
      type: DataTypes.STRING, // 备注
    },
  });
};

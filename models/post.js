const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Post", {
    // 帖子类型: 'forum'(论坛), 'second_hand'(二手), 'lost_found'(失物), 'found'(招领)
    type: {
      type: DataTypes.ENUM('forum', 'second_hand', 'lost_found', 'found'),
      allowNull: false,
      defaultValue: 'forum'
    },
    // 标题
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 内容
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // 图片列表 (存储为 JSON 字符串)
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('images');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('images', JSON.stringify(value));
      }
    },
    // 发布者 OpenID
    authorId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 发布者昵称
    authorName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 发布者头像
    authorAvatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 二手价格
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // 联系方式
    contact: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 浏览量
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 点赞数
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 审核状态: 0-待审核, 1-已通过, 2-已拒绝
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
};

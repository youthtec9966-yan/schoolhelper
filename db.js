const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  logging: false, // 生产环境建议关闭日志
});

// 引入模型
const definePost = require('./models/post');
const defineNews = require('./models/news');
const defineClub = require('./models/club');
const defineActivity = require('./models/activity');
const defineUser = require('./models/user');
const defineCarousel = require('./models/carousel');
const defineComment = require('./models/comment');
const definePostLike = require('./models/post_like');
const defineCourse = require('./models/course');

// 初始化模型
const Post = definePost(sequelize);
const News = defineNews(sequelize);
const Club = defineClub(sequelize);
const Activity = defineActivity(sequelize);
const User = defineUser(sequelize);
const Carousel = defineCarousel(sequelize);
const Comment = defineComment(sequelize);
const PostLike = definePostLike(sequelize);
const Course = defineCourse(sequelize);

// 建立关联
Post.hasMany(Comment, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

Post.hasMany(PostLike, { foreignKey: 'postId' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });

// 保留 Counter 示例，以免破坏原有逻辑
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

// 数据库初始化方法
async function init() {
  // sync({ alter: true }) 会自动根据模型修改表结构，生产环境慎用 alter，建议用 migration
  // 但对于云托管初学者，alter 是最方便的
  await Counter.sync({ alter: true });
  await Post.sync({ alter: true });
  await News.sync({ alter: true });
  await Club.sync({ alter: true });
  await Activity.sync({ alter: true });
  await User.sync({ alter: true });
  await Carousel.sync({ alter: true });
  await Comment.sync({ alter: true });
  await PostLike.sync({ alter: true });
  await Course.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  sequelize,
  Counter,
  Post,
  News,
  Club,
  Activity,
  User,
  Carousel,
  Comment,
  PostLike,
  Course
};

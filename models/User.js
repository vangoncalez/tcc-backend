const Sequelize = require('sequelize')
const db = require('./db')

const User = db.define('users', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  password: {
    type: Sequelize.STRING,
  },
  userType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  recover_password: {
    type: Sequelize.STRING,
  },
  parentId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
})

// User.sync({ alter: true })
// User.sync()

module.exports = User

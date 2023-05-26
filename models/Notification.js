const Sequelize = require('sequelize')
const db = require('./db')

const Notification = db.define('notification', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  notification: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  notificationType: {
    type: Sequelize.ENUM(
      'DEPOSIT',
      'WITHDRAW',
      'WAITING',
      'SCHEDULE',
      'APPROVAL',
      'REPPROVAL'
    ),
    allowNull: false,
  },
  readMark: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  selectedChild: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
})

// Notification.sync({ alter: true })
// Notification.sync()

module.exports = Notification

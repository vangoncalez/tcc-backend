const Sequelize = require('sequelize')
const db = require('./db')

const Movement = db.define('movements', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  value: {
    type: Sequelize.DOUBLE,
    allowNull: false,
  },
  movementType: {
    type: Sequelize.ENUM('DEPOSIT', 'WITHDRAW', 'WAITING'),
    allowNull: false,
  },
  fromId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  toId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
})

// Movement.sync({alter: true});
// Movement.sync()

module.exports = Movement

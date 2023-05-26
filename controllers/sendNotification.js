const User = require('../models/User')
const Movement = require('../models/Movement')
const Notification = require('../models/Notification')
const { sendWebSocketMessage } = require('../controllers/ws')

async function sendNotification(notificationType, childId, parentId) {
  var childName
  var parentName
  var movement
  var notification
  var userId
  var dados

  ////Se é withdraw
  if (notificationType == 'WITHDRAW') {
    childName = await getName(childId)
    movement = await getWaiting(childId, parentId)
    userId = parentId
    selectedChild = childId

    if (movement) {
      const valueFormatted = movement.value.toFixed(2).replace('.', ',') // formata o valor em 0,00
      const dateFormatted = movement.createdAt.toLocaleString('pt-BR') // formata a data em DD/MM/AAAA HH:mm

      notification =
        childName +
        ' solicitou um saque de R$ ' +
        valueFormatted +
        ' em ' +
        dateFormatted
    }
  }

  ////Se é deposit
  if (notificationType == 'DEPOSIT') {
    parentName = await getName(parentId)
    movement = await getDeposit(childId, parentId)
    userId = childId
    selectedChild = childId

    if (movement) {
      const valueFormatted = movement.value.toFixed(2).replace('.', ',') // formata o valor em 0,00
      const dateFormatted = movement.createdAt.toLocaleString('pt-BR') // formata a data em DD/MM/AAAA HH:mm

      notification =
        parentName +
        ' efetuou um depósito de R$ ' +
        valueFormatted +
        ' em ' +
        dateFormatted
    }
  }

  ////Se é APPROVAL
  if (notificationType == 'APPROVAL') {
    parentName = await getName(parentId)
    userId = childId
    selectedChild = childId

    movement = await getWithdraw(childId, parentId)
    if (movement) {
      const valueFormatted = movement.value.toFixed(2).replace('.', ',') // formata o valor em 0,00
      const dateFormatted = movement.createdAt.toLocaleString('pt-BR') // formata a data em DD/MM/AAAA HH:mm

      notification =
        parentName +
        ' aprovou o seu saque de R$ ' +
        valueFormatted +
        ' efetuado em ' +
        dateFormatted
    }
  }

  ////Se é REPPROVAL
  if (notificationType == 'REPPROVAL') {
    parentName = await getName(parentId)
    userId = childId
    movement = true
    notification = parentName + ' reprovou o seu saque!'
    selectedChild = childId
  }

  ////Salva notificações
  dados = {
    notification,
    notificationType,
    userId,
    selectedChild,
  }

  movement && saveNotification(dados)
  try {
    sendWebSocketMessage(userId, 'notifications')
  } catch (err) {
    console.log(err)
  }
}

async function saveNotification(dados) {
  try {
    await Notification.create(dados)
  } catch (err) {
    console.log(err)
  }
}

async function getName(id) {
  const user = await User.findByPk(id)
  return user.name
}

async function getWaiting(childId, parentId) {
  const movement = await Movement.findOne({
    where: {
      fromId: childId,
      toId: parentId,
      movementType: 'WAITING',
    },
    order: [['id', 'DESC']],
  })
  return movement
}

async function getWithdraw(childId, parentId) {
  const movement = await Movement.findOne({
    where: {
      fromId: childId,
      toId: parentId,
      movementType: 'WITHDRAW',
    },
    order: [['id', 'DESC']],
  })
  return movement
}

async function getDeposit(childId, parentId) {
  const movement = await Movement.findOne({
    where: {
      toId: childId,
      fromId: parentId,
      movementType: 'DEPOSIT',
    },
    order: [['id', 'DESC']],
  })
  return movement
}

module.exports = sendNotification

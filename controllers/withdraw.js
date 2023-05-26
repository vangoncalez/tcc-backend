const express = require('express')
const router = express.Router()
const { eAdmin } = require('../middlewares/auth')
const Movement = require('../models/Movement')
const User = require('../models/User')
const Sequelize = require('sequelize')
const yup = require('yup')
const { Op } = require('sequelize')
const sendNotification = require('./sendNotification')

router.get('/:id', eAdmin, async (req, res) => {
  const parentId = req.userId
  const { id } = req.params

  await Movement.findAll({
    attributes: ['id', 'description', 'value', 'createdAt'],
    order: [['id', 'DESC']],
    where: {
      toId: parentId,
      fromId: id,
      movementType: 'WAITING',
    },
  })
    .then((movement) => {
      return res.json({
        data: { withdraw: movement },
      })
    })
    .catch(() => {
      return res.status(400).json({
        message: 'Nada encontrado!',
      })
    })
})

////solicita saque

router.post('/', eAdmin, async (req, res) => {
  const id = req.userId
  var dados = req.body

  ////VERIFICA SE OS DADOS FORAM PREENCHIDOS
  const schema = yup.object().shape({
    description: yup
      .string('Necessário preencher o campo descrição!')
      .required('Necessário preencher o campo descrição!'),
    withdraw: yup
      .number('Necessário preencher o campo valor!')
      .positive('O valor deve ser maior que 0,00!')
      .required('Necessário preencher o campo valor!'),
  })

  try {
    await schema.validate(dados)
  } catch (err) {
    return res.status(400).json({
      message: err.errors,
    })
  }

  ////SE TIVER OUTROS SAQUES EM ABERTO, RETORNA
  const saques = await Movement.findOne({
    where: {
      fromId: id,
      movementType: 'WAITING',
    },
  })

  if (saques) {
    return res.status(400).json({
      message:
        'Saque não realizado! Você possui um saque aguardando aprovação!',
    })
  }

  ////VERIFICA O SALDO

  const saldo = await Movement.findOne({
    attributes: [
      [
        Sequelize.fn(
          'SUM',
          Sequelize.literal('CASE WHEN fromId = :id THEN -value ELSE value END')
        ),
        'balance',
      ],
    ],
    where: {
      [Op.or]: [{ fromId: id }, { toId: id }],
      movementType: { [Op.ne]: 'WAITING' },
    },
    raw: true,
    replacements: { id },
  })

  ////SE FOR MENOR QUE O SALDO RETORNA

  if (parseFloat(dados.withdraw) > parseFloat(saldo.balance) + 0.01) {
    return res.status(400).json({
      saldo: saldo.balance,
      saque: Number(dados.withdraw),
      message: 'Saque não realizado! Você não possui saldo para esse valor!',
    })
  }

  ////BUSCA ID DO RESPONSÁVEL
  const user = await User.findOne({
    where: {
      id: id,
    },
  })

  ////ORGANIZA OS DADOS
  dados.toId = user.parentId
  dados.fromId = id
  dados.movementType = 'WAITING'
  dados.value = req.body.withdraw

  try {
    await Movement.create(dados)
  } catch (err) {
    return res.status(400).json({
      message: 'Saque não solicitado!',
    })
  }

  sendNotification('WITHDRAW', id, user.parentId)
  return res.json({
    message: 'Saque solicitado com sucesso!',
  })
})

///////EDITAR withdraw - OK

router.put('/:id', eAdmin, async (req, res) => {
  const { id } = req.params
  const parentId = req.userId
  var dados = {}

  //VERIFICA SE O SAQUE É MESMO DESSE PARENTID E EXIBE UM ERRO GENERICO
  const withdrawParent = await Movement.findOne({
    where: {
      id: id,
      toId: parentId,
    },
  })

  if (!withdrawParent) {
    return res.status(400).json({
      message: 'Há um erro sua solicitação',
    })
  }

  dados.movementType = 'WITHDRAW'

  try {
    await Movement.update(dados, { where: { id } })
  } catch (err) {
    return res.status(400).json({
      message: 'O Saque não foi aprovado com sucesso!',
    })
  }

  try {
    sendNotification('APPROVAL', withdrawParent.fromId, parentId)
  } catch (err) {
    console.log(err)
  }

  return res.json({
    message: 'Saque aprovado com sucesso!',
    data: { withdraw: [] },
  })
})

////REPROVA O SAQUE - OK
router.delete('/:id', eAdmin, async (req, res) => {
  const { id } = req.params
  const parentId = req.userId

  //VERIFICA SE O SAQUE É MESMO DESSE PARENTID E EXIBE UM ERRO GENERICO
  const withdrawParent = await Movement.findOne({
    where: {
      id: id,
      toId: parentId,
    },
  })

  if (!withdrawParent) {
    return res.status(400).json({
      message: 'Há um erro sua solicitação',
    })
  }

  ////APAGA O SAQUE
  try {
    await Movement.destroy({ where: { id } })
  } catch (err) {
    return res.status(400).json({
      message: 'O Saque não foi excluído com sucesso!',
    })
  }

  ////ENVIA NOTIFICAÇÃO
  try {
    sendNotification('REPPROVAL', withdrawParent.fromId, parentId)
  } catch (err) {
    console.log(err)
  }

  return res.json({
    message: 'Saque excluído com sucesso!',
    data: { withdraw: [] },
  })
})

module.exports = router

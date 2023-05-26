const express = require('express')
var cors = require('cors')
const WebSocket = require('ws')
require('dotenv').config()

const { handleWebSocketEvents } = require('./controllers/ws')

const withdraw = require('./controllers/withdraw')

const app = express()

app.use(express.json())

const corsOptions = {
  origin: [
    'https://cofrinhodigital.com.br',
    'https://www.cofrinhodigital.com.br',
  ],
  methods: 'GET, PUT, POST, DELETE',
  allowedHeaders: 'X-PINGOTHER, Content-Type, Authorization, cache-control',
  exposedHeaders: 'cache-control',
}

app.use(cors(corsOptions))

const backendPrefix = process.env.AMBIENTE === 'P' ? '/bff' : ''

app.use(`${backendPrefix}/withdraw`, withdraw)

const server = app.listen(process.env.PORT, () => {
  console.log('Servidor iniciado na porta ' + process.env.PORT)
})

const wss = new WebSocket.Server({ server })

handleWebSocketEvents(wss)

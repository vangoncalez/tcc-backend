const jwt = require('jsonwebtoken')
const { promisify } = require('util')

const connectedUsers = new Map()

async function handleWebSocketEvents(wss) {
  wss.on('connection', async (ws, req) => {
    const token = req.url.split('?')[1].split('=')[1]
    const id = req.headers['sec-websocket-key']

    try {
      const decoded = await promisify(jwt.verify)(token, process.env.SECRET)
      clientId = decoded.id
      connectedUsers.set(clientId, ws)
    } catch (error) {
      console.error(error)
      ws.close()
    }

    ws.send('Conexão estabelecida com sucesso')

    ws.on('close', () => {
      connectedUsers.delete(clientId)
    })
  })
}

function sendWebSocketMessage(clientIdReceived, message) {
  connectedUsers.forEach((ws, clientId) => {
    if (clientIdReceived == clientId) {
      ws.send(message)
    }
  })
  return false
}

module.exports = {
  handleWebSocketEvents,
  sendWebSocketMessage,
}

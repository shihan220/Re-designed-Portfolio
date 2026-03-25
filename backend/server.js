import express from 'express'
import { createServer } from 'node:http'
import msgpack from 'msgpack-lite'
import { v4 as uuidv4 } from 'uuid'
import { WebSocket, WebSocketServer } from 'ws'

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || 8787)
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_WHISPERS = Number(process.env.MAX_WHISPERS || 30)
const MAX_WHISPER_MESSAGE_LENGTH = Number(process.env.MAX_WHISPER_MESSAGE_LENGTH || 30)
const MAX_LEADERBOARD_SCORES = Number(process.env.MAX_LEADERBOARD_SCORES || 10)
const CATACLYSM_TARGET = Number(process.env.CATACLYSM_TARGET || 100)

const state = {
    whispers: [],
    cookiesCount: 0,
    cataclysmCount: 0,
    circuitResetTime: Date.now(),
    circuitLeaderboard: []
}

const app = express()
app.disable('x-powered-by')

const cataclysmProgress = () =>
{
    return (state.cataclysmCount % CATACLYSM_TARGET) / CATACLYSM_TARGET
}

const createInitPayload = () =>
{
    return {
        type: 'init',
        whispers: state.whispers,
        cookiesCount: state.cookiesCount,
        cataclysmCount: state.cataclysmCount,
        cataclysmProgress: cataclysmProgress(),
        circuitResetTime: state.circuitResetTime,
        circuitLeaderboard: state.circuitLeaderboard
    }
}

const encode = (data) => msgpack.encode(data)
const decode = (buffer) => msgpack.decode(new Uint8Array(buffer))

const send = (socket, data) =>
{
    if(socket.readyState === WebSocket.OPEN)
        socket.send(encode(data))
}

const server = createServer(app)
const websocketServer = new WebSocketServer({ server })

const broadcast = (data) =>
{
    const payload = encode(data)

    for(const client of websocketServer.clients)
    {
        if(client.readyState === WebSocket.OPEN)
            client.send(payload)
    }
}

const clampInteger = (value, fallback = 0) =>
{
    const number = Number(value)

    if(!Number.isFinite(number))
        return fallback

    return Math.round(number)
}

const sanitizeCountryCode = (value) =>
{
    if(typeof value !== 'string')
        return ''

    return value.trim().toLowerCase().slice(0, 2)
}

const sanitizeWhisperMessage = (value) =>
{
    if(typeof value !== 'string')
        return ''

    return value.trim().slice(0, MAX_WHISPER_MESSAGE_LENGTH)
}

const sanitizeTag = (value) =>
{
    if(typeof value !== 'string')
        return ''

    return value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 3)
}

const sortCircuitLeaderboard = () =>
{
    state.circuitLeaderboard = state.circuitLeaderboard
        .sort((scoreA, scoreB) => scoreA[2] - scoreB[2])
        .slice(0, MAX_LEADERBOARD_SCORES)
}

const resetCircuitLeaderboardIfNeeded = () =>
{
    const now = Date.now()

    if(now - state.circuitResetTime < DAY_MS)
        return

    const elapsedWindows = Math.floor((now - state.circuitResetTime) / DAY_MS)
    state.circuitResetTime += elapsedWindows * DAY_MS
    state.circuitLeaderboard = []

    broadcast(createInitPayload())
}

setInterval(resetCircuitLeaderboardIfNeeded, 60 * 1000)

app.get('/health', (_request, response) =>
{
    resetCircuitLeaderboardIfNeeded()

    response.json({
        ok: true,
        websocketUrl: `ws://${HOST}:${PORT}`,
        stats: {
            whispers: state.whispers.length,
            cookiesCount: state.cookiesCount,
            cataclysmCount: state.cataclysmCount,
            circuitScores: state.circuitLeaderboard.length,
            connectedClients: websocketServer.clients.size
        }
    })
})

const handlers = {
    whispersInsert(message)
    {
        const whisper = {
            id: uuidv4(),
            message: sanitizeWhisperMessage(message.message),
            countrycode: sanitizeCountryCode(message.countryCode),
            x: clampInteger(message.x),
            y: clampInteger(message.y),
            z: clampInteger(message.z)
        }

        if(!whisper.message)
            return

        state.whispers.push(whisper)

        let deletedWhisper = null

        if(state.whispers.length > MAX_WHISPERS)
            deletedWhisper = state.whispers.shift()

        if(deletedWhisper)
        {
            broadcast({
                type: 'whispersDelete',
                whispers: [ { id: deletedWhisper.id } ]
            })
        }

        broadcast({
            type: 'whispersInsert',
            whispers: [ whisper ]
        })
    },

    cookiesInsert(message)
    {
        const amount = clampInteger(message.amount)

        if(amount <= 0)
            return

        state.cookiesCount += amount

        broadcast({
            type: 'cookiesUpdate',
            cookiesCount: state.cookiesCount
        })
    },

    cataclysmInsert()
    {
        state.cataclysmCount += 1

        broadcast({
            type: 'cataclysmUpdate',
            cataclysmCount: state.cataclysmCount,
            cataclysmProgress: cataclysmProgress()
        })
    },

    circuitInsert(message)
    {
        resetCircuitLeaderboardIfNeeded()

        const tag = sanitizeTag(message.tag)
        const duration = clampInteger(message.duration, -1)

        if(tag.length !== 3 || duration <= 0)
            return

        state.circuitLeaderboard.push([
            tag,
            sanitizeCountryCode(message.countryCode),
            duration
        ])

        sortCircuitLeaderboard()

        broadcast({
            type: 'circuitUpdate',
            circuitLeaderboard: state.circuitLeaderboard
        })
    }
}

websocketServer.on('connection', (socket) =>
{
    send(socket, createInitPayload())

    socket.on('message', (buffer) =>
    {
        try
        {
            const message = decode(buffer)

            if(!message || typeof message.type !== 'string')
                return

            const handler = handlers[message.type]

            if(typeof handler === 'function')
                handler(message)
        }
        catch(error)
        {
            console.error('WebSocket message error:', error)
        }
    })
})

server.listen(PORT, HOST, () =>
{
    console.log('Backend ready')
    console.log(`Health: http://${HOST}:${PORT}/health`)
    console.log(`WebSocket: ws://${HOST}:${PORT}`)
})

const shutdown = () =>
{
    websocketServer.close(() =>
    {
        server.close(() =>
        {
            process.exit(0)
        })
    })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

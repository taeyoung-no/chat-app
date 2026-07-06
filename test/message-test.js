const axios = require('axios')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const { io } = require('socket.io-client')

dotenv.config({ quiet: true })

const BASE_URL = process.env.VITE_API_URL || 'https://localhost:8443'
const DURATION = 60
const ARRIVAL_RATE = 30
const ARRIVAL_COUNT = DURATION * ARRIVAL_RATE

const ROOM_ID = '6a4a191e814339ee18f37a61'

let requests = 0
const codes = {}
const httpLatencies = []
let emits = 0
const socketLatencies = []
const vusers = { created: 0, completed: 0, failed: 0 }

let start = 0
const scenarios = []

const USERS_CSV = path.join(__dirname, 'users.csv')
let usernames = []
try {
  const content = fs.readFileSync(USERS_CSV, 'utf8')
  usernames = content
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
let userIndex = 0

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function recordHttp(status, latency) {
  requests++
  codes[status] = (codes[status] || 0) + 1
  httpLatencies.push(latency)
}

function recordSocket(latency) {
  emits++
  socketLatencies.push(latency)
}

function getCookies(res) {
  try {
    const cookies = res.headers['set-cookie']
    const cookieHeaders = cookies.map((cookie) => cookie.split(';')[0])
    return cookieHeaders.join('; ')
  } catch (_) {
    return ''
  }
}

function percentile(arr, p) {
  const i = (p / 100) * (arr.length - 1)
  return arr[Math.floor(i)]
}

async function scenario() {
  const username = usernames[userIndex++ % usernames.length]
  vusers.created++
  let cookie = ''
  try {
    // 1. login
    let t0 = performance.now()
    let res = await axios.post(
      `${BASE_URL}/auth/login`,
      { username, password: 'password' },
      {
        headers: cookie
          ? { 'Content-Type': 'application/json', Cookie: cookie }
          : { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    )
    let latency = performance.now() - t0
    recordHttp(res.status, latency)
    cookie = getCookies(res) || cookie
    if (res.status !== 200) {
      vusers.failed++
      return
    }

    // 2. join
    const socket = io(BASE_URL, {
      withCredentials: true,
      extraHeaders: cookie ? { Cookie: cookie } : {},
    })

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect()
        reject(new Error('socket connect timeout'))
      }, 10000)
      socket.on('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
      socket.on('connect_error', (err) => {
        clearTimeout(timeout)
        socket.disconnect()
        reject(err)
      })
    })

    t0 = performance.now()
    socket.emit('join', ROOM_ID)

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect()
        reject(new Error('join/messages timeout'))
      }, 10000)
      socket.once('messages', () => {
        recordSocket(performance.now() - t0)
        clearTimeout(timeout)
        resolve()
      })
      socket.once('error', (err) => {
        clearTimeout(timeout)
        socket.disconnect()
        reject(err)
      })
    })

    // 3. message
    const content = `test_${randomString(6)}`
    t0 = performance.now()
    socket.emit('message', { roomId: ROOM_ID, content })

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect()
        resolve()
      }, 5000)
      socket.once('message', () => {
        recordSocket(performance.now() - t0)
        clearTimeout(timeout)
        resolve()
      })
      socket.once('error', (err) => {
        clearTimeout(timeout)
        socket.disconnect()
        reject(err)
      })
    })

    socket.disconnect()

    vusers.completed++
  } catch (_) {
    vusers.failed++
  }
}

function finalReport() {
  {
    console.log(`${(Date.now() - start) / 1000}s`)
    console.log('\n[vusers]')
    console.log('created:', vusers.created)
    console.log('completed:', vusers.completed)
    console.log('failed:', vusers.failed)

    console.log('\n[http.requests]')
    console.log(`total: ${requests}`)
    Object.keys(codes)
      .sort()
      .forEach((code) => console.log(`${code}: ${codes[code]}`))

    httpLatencies.sort((a, b) => a - b)
    const min = httpLatencies[0]
    const max = httpLatencies[httpLatencies.length - 1]
    let sum = 0
    for (const latency of httpLatencies) {
      sum += latency
    }
    const mean = sum / httpLatencies.length
    const median = httpLatencies[Math.floor(httpLatencies.length / 2)]

    console.log('\n[http.response_time]')
    console.log(`min: ${min.toFixed(1)}`)
    console.log(`max: ${max.toFixed(1)}`)
    console.log(`mean: ${mean.toFixed(1)}`)
    console.log(`median: ${median.toFixed(1)}`)
    console.log(`p95: ${percentile(httpLatencies, 95).toFixed(1)}`)
    console.log(`p99: ${percentile(httpLatencies, 99).toFixed(1)}`)

    console.log('\n[socketio.emits]')
    console.log(`total: ${emits}`)
  }

  {
    socketLatencies.sort((a, b) => a - b)
    const min = socketLatencies[0]
    const max = socketLatencies[socketLatencies.length - 1]
    let sum = 0
    for (const latency of socketLatencies) {
      sum += latency
    }
    const mean = sum / socketLatencies.length
    const median = socketLatencies[Math.floor(socketLatencies.length / 2)]

    console.log('\n[socketio.response_time]')
    console.log(`min: ${min.toFixed(1)}`)
    console.log(`max: ${max.toFixed(1)}`)
    console.log(`mean: ${mean.toFixed(1)}`)
    console.log(`median: ${median.toFixed(1)}`)
    console.log(`p95: ${percentile(socketLatencies, 95).toFixed(1)}`)
    console.log(`p99: ${percentile(socketLatencies, 99).toFixed(1)}`)
  }
}

async function main() {
  start = Date.now()
  const end = start + DURATION * 1000
  const dt = 1000 / ARRIVAL_RATE

  const prog = setInterval(() => {
    process.stdout.write(`\r${vusers.completed}/${ARRIVAL_COUNT}`)
  }, 100)

  let next = start
  while (Date.now() < end) {
    if (Date.now() >= next) {
      scenarios.push(scenario())
      next += dt
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
  }
  await Promise.allSettled(scenarios)

  clearInterval(prog)
  process.stdout.write(`\r${vusers.completed}/${ARRIVAL_COUNT}\n`)

  finalReport()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

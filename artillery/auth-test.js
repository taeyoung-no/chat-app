const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config({ quiet: true })

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080'
const DURATION = 60
const ARRIVAL_RATE = 30
const ARRIVAL_COUNT = DURATION * ARRIVAL_RATE

let requests = 0
const codes = {}
const latencies = []
const vusers = { created: 0, completed: 0, failed: 0 }

let start = 0
const scenarios = []

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function record(status, latency) {
  requests++
  codes[status] = (codes[status] || 0) + 1
  latencies.push(latency)
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
  const username = `test_ ${randomString(8)}`
  vusers.created++
  let cookie = ''
  try {
    // 1. register
    let t0 = performance.now()
    let res = await axios.post(
      `${BASE_URL}/auth/register`,
      { username, password: 'password' },
      {
        headers: cookie
          ? { 'Content-Type': 'application/json', Cookie: cookie }
          : { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    )
    let latency = performance.now() - t0
    record(res.status, latency)
    cookie = getCookies(res) || cookie
    if (res.status !== 201) {
      vusers.failed++
      return
    }

    // 2. login
    t0 = performance.now()
    res = await axios.post(
      `${BASE_URL}/auth/login`,
      { username, password: 'password' },
      {
        headers: cookie
          ? { 'Content-Type': 'application/json', Cookie: cookie }
          : { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    )
    latency = performance.now() - t0
    record(res.status, latency)
    cookie = getCookies(res) || cookie
    if (res.status !== 200) {
      vusers.failed++
      return
    }

    // 3. me
    t0 = performance.now()
    res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: cookie ? { Cookie: cookie } : {},
      validateStatus: () => true,
    })
    latency = performance.now() - t0
    record(res.status, latency)
    if (res.status !== 200) {
      vusers.failed++
      return
    }

    vusers.completed++
  } catch (_) {
    vusers.failed++
  }
}

function finalReport() {
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

  latencies.sort((a, b) => a - b)
  const min = latencies[0]
  const max = latencies[latencies.length - 1]
  let sum = 0
  for (const latency of latencies) {
    sum += latency
  }
  const mean = sum / latencies.length
  const median = latencies[Math.floor(latencies.length / 2)]

  console.log('\n[http.response_time]')
  console.log(`min: ${min.toFixed(1)}`)
  console.log(`max: ${max.toFixed(1)}`)
  console.log(`mean: ${mean.toFixed(1)}`)
  console.log(`median: ${median.toFixed(1)}`)
  console.log(`p95: ${percentile(latencies, 95).toFixed(1)}`)
  console.log(`p99: ${percentile(latencies, 99).toFixed(1)}`)
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

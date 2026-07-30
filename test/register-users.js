const fs = require('fs').promises
const path = require('path')

require('dotenv').config({ quiet: true })

const PATH = path.join(__dirname, 'users.csv')
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000'
const BATCH_SIZE = 100

/** 회원가입 성공 시 혹은 이미 가입된 경우 true 반환 */
async function register(username) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'password' }),
  })
  return res.status === 201 || res.status === 409
}

async function processBatch(usernames, i) {
  const batch = usernames.slice(i, i + BATCH_SIZE)
  const results = await Promise.all(batch.map((u) => register(u)))

  let batchSuccess = 0
  let batchFail = 0

  results.forEach((r) => {
    if (r) batchSuccess++
    else batchFail++
  })

  return { batchSuccess, batchFail }
}

async function main() {
  const content = await fs.readFile(PATH, 'utf8')
  const lines = content.trim().split(/\r?\n/)
  const usernames = lines.slice(1).filter((line) => line.trim().length > 0)
  const total = usernames.length

  let success = 0
  let fail = 0

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const { batchSuccess, batchFail } = await processBatch(usernames, i)
    success += batchSuccess
    fail += batchFail
    console.log(`${Math.min(i + BATCH_SIZE, total)}/${total} | 성공: ${success}개 | 실패: ${fail}개`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

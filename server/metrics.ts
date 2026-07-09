import client from 'prom-client'

export const register = new client.Registry()

client.collectDefaultMetrics({ register })

export const sseClientsGauge = new client.Gauge({
  name: 'chat_sse_clients',
  help: 'Number of SSE responses currently tracked in the in-memory Set',
  registers: [register],
})

export function setSseClientCount(count: number) {
  sseClientsGauge.set(count)
}

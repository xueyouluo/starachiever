import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createToken, verifyToken } from './jwt.js'
import { exchangeWechatCode } from './wechat.js'

const isStorageData = (value) => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray(value.children) &&
      (typeof value.activeChildId === 'string' || value.activeChildId === null || value.activeChildId === undefined),
  )
}

const sanitizeStorageData = (data) => ({
  children: data.children,
  activeChildId: data.activeChildId ?? data.children[0]?.id ?? null,
})

export const createServer = ({ config, repository }) => {
  const app = Fastify({ logger: true })

  app.register(cors, {
    origin: true,
    credentials: false,
  })

  app.get('/api/health', async () => ({
    ok: true,
    service: 'starachiever-server',
    timestamp: new Date().toISOString(),
  }))

  app.post('/api/auth/wechat', async (request, reply) => {
    const code = request.body?.code
    if (!code || typeof code !== 'string') {
      return reply.code(400).send({ error: 'code is required' })
    }

    let session
    try {
      session = await exchangeWechatCode({ code, config })
    } catch (error) {
      request.log.warn({ err: error }, 'wechat auth failed')
      return reply.code(401).send({ error: 'wechat auth failed' })
    }

    if (!session.openid) {
      return reply.code(401).send({ error: 'openid missing' })
    }

    repository.upsertUser(session.openid)
    const token = createToken({
      openid: session.openid,
      secret: config.jwtSecret,
      ttlSeconds: config.tokenTtlSeconds,
    })

    return {
      ...token,
      openid: session.openid,
    }
  })

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/api/data')) return

    const header = request.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
    if (!token) {
      return reply.code(401).send({ error: 'missing token' })
    }

    try {
      const payload = verifyToken(token, config.jwtSecret)
      request.openid = payload.sub
    } catch {
      return reply.code(401).send({ error: 'invalid token' })
    }
  })

  app.get('/api/data', async (request) => {
    const snapshot = repository.getSnapshot(request.openid)
    if (!snapshot) {
      return { data: null }
    }

    return snapshot
  })

  app.put('/api/data', async (request, reply) => {
    const body = request.body || {}
    if (!isStorageData(body.data)) {
      return reply.code(400).send({ error: 'data must include children and activeChildId' })
    }

    const snapshot = repository.saveSnapshot(request.openid, {
      data: sanitizeStorageData(body.data),
      dataVersion: body.dataVersion || 'v6',
      clientUpdatedAt: body.clientUpdatedAt,
    })

    return snapshot
  })

  return app
}

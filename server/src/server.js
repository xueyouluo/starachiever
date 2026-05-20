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

const getDateKey = (dateValue) => {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }
  return new Date().toISOString().slice(0, 10)
}

const getTaskCategoryName = (task) => {
  if (!task?.category) return '其他'
  if (typeof task.category === 'string') return task.category
  return task.category.name || '其他'
}

const summarizeChild = (child, dateKey) => {
  const tasks = Array.isArray(child.tasks) ? child.tasks : []
  const dailyHistory = child.dailyHistory?.[dateKey]
  const completedTasksFromDailyHistory = Array.isArray(dailyHistory?.tasks) ? dailyHistory.tasks : []
  const completedTasksFromCurrentState = child.lastLoginDate === dateKey
    ? tasks.filter((task) => task.completed)
    : []
  const completedTasks = completedTasksFromDailyHistory.length > 0
    ? completedTasksFromDailyHistory
    : completedTasksFromCurrentState.map((task) => ({
        id: task.id,
        title: task.title,
        icon: task.icon,
        points: task.points,
        category: getTaskCategoryName(task),
      }))

  const todayCompletedTasks = Number(dailyHistory?.totalTasks ?? child.history?.[dateKey] ?? completedTasks.length)
  const todayPoints = Number(dailyHistory?.totalPoints ?? completedTasks.reduce((sum, task) => sum + Number(task.points || 0), 0))
  const redemptions = Array.isArray(child.redemptions) ? child.redemptions : []
  const todayRedemptions = redemptions.filter((redemption) => {
    const value = redemption.date || redemption.redeemedAt || redemption.createdAt
    return typeof value === 'string' && value.slice(0, 10) === dateKey
  })

  return {
    id: child.id,
    name: child.name,
    avatar: child.avatar,
    totalPoints: Number(child.totalPoints || 0),
    currentStreak: Number(child.currentStreak || 0),
    lastLoginDate: child.lastLoginDate || null,
    totalTasks: tasks.length,
    currentCompletedTasks: tasks.filter((task) => task.completed).length,
    todayCompletedTasks,
    todayPoints,
    todayRedemptions: todayRedemptions.length,
    totalRedemptions: redemptions.length,
    totalTasksCompleted: Number(child.stats?.totalTasksCompleted || 0),
    totalPointsEarned: Number(child.stats?.totalPointsEarned || 0),
    unlockedBadges: Array.isArray(child.unlockedBadges) ? child.unlockedBadges.length : 0,
    completedTasks: completedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      icon: task.icon,
      points: Number(task.points || 0),
      category: getTaskCategoryName(task),
      completedTime: task.completedTime || null,
    })),
  }
}

const summarizeSnapshot = (snapshot, dateKey) => {
  const data = snapshot.data || {}
  const children = Array.isArray(data.children) ? data.children : []

  return {
    openid: snapshot.openid,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
    dataVersion: snapshot.dataVersion || null,
    clientUpdatedAt: snapshot.clientUpdatedAt || null,
    serverUpdatedAt: snapshot.serverUpdatedAt || null,
    activeChildId: data.activeChildId || null,
    childrenCount: children.length,
    children: children.map((child) => summarizeChild(child, dateKey)),
  }
}

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
    if (request.url.startsWith('/api/admin')) {
      const header = request.headers.authorization || ''
      const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
      if (!token || token !== config.adminReadToken) {
        return reply.code(401).send({ error: 'invalid admin token' })
      }
      return
    }

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

  app.get('/api/admin/users', async (request) => {
    const dateKey = getDateKey(request.query?.date)
    return {
      date: dateKey,
      users: repository.listSnapshots().map((snapshot) => {
        const summary = summarizeSnapshot(snapshot, dateKey)
        return {
          openid: summary.openid,
          createdAt: summary.createdAt,
          updatedAt: summary.updatedAt,
          clientUpdatedAt: summary.clientUpdatedAt,
          serverUpdatedAt: summary.serverUpdatedAt,
          childrenCount: summary.childrenCount,
          children: summary.children.map((child) => ({
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            totalPoints: child.totalPoints,
            todayCompletedTasks: child.todayCompletedTasks,
            todayPoints: child.todayPoints,
            currentStreak: child.currentStreak,
          })),
        }
      }),
    }
  })

  app.get('/api/admin/users/:openid/stats', async (request, reply) => {
    const dateKey = getDateKey(request.query?.date)
    const snapshot = repository.listSnapshots().find((item) => item.openid === request.params.openid)
    if (!snapshot) {
      return reply.code(404).send({ error: 'user not found' })
    }

    return {
      date: dateKey,
      user: summarizeSnapshot(snapshot, dateKey),
    }
  })

  return app
}

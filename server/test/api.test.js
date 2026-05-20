import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { loadConfig } from '../src/config.js'
import { openDatabase, createRepository } from '../src/database.js'
import { createServer } from '../src/server.js'

const createTestApp = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'starachiever-server-'))
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: path.join(dir, 'test.sqlite'),
    JWT_SECRET: 'test-secret',
    ADMIN_READ_TOKEN: 'admin-secret',
    WECHAT_AUTH_MOCK: 'true',
  })
  const db = openDatabase(config.databasePath)
  const repository = createRepository(db)
  return createServer({ config, repository })
}

test('health endpoint is public', async () => {
  const app = createTestApp()
  const response = await app.inject({ method: 'GET', url: '/api/health' })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().ok, true)
})

test('data endpoints require token', async () => {
  const app = createTestApp()
  const response = await app.inject({ method: 'GET', url: '/api/data' })

  assert.equal(response.statusCode, 401)
})

test('wechat auth mock creates isolated user snapshots', async () => {
  const app = createTestApp()

  const firstAuth = await app.inject({
    method: 'POST',
    url: '/api/auth/wechat',
    payload: { code: 'family-a' },
  })
  const secondAuth = await app.inject({
    method: 'POST',
    url: '/api/auth/wechat',
    payload: { code: 'family-b' },
  })

  assert.equal(firstAuth.statusCode, 200)
  assert.equal(secondAuth.statusCode, 200)

  const firstToken = firstAuth.json().token
  const secondToken = secondAuth.json().token
  const firstData = {
    children: [{ id: 'child-a', name: 'A' }],
    activeChildId: 'child-a',
  }

  const putResponse = await app.inject({
    method: 'PUT',
    url: '/api/data',
    headers: { authorization: `Bearer ${firstToken}` },
    payload: { data: firstData, clientUpdatedAt: '2026-05-20T00:00:00.000Z' },
  })
  assert.equal(putResponse.statusCode, 200)

  const firstGet = await app.inject({
    method: 'GET',
    url: '/api/data',
    headers: { authorization: `Bearer ${firstToken}` },
  })
  const secondGet = await app.inject({
    method: 'GET',
    url: '/api/data',
    headers: { authorization: `Bearer ${secondToken}` },
  })

  assert.deepEqual(firstGet.json().data, firstData)
  assert.equal(secondGet.json().data, null)
})

test('admin stats endpoints require admin token and summarize snapshots', async () => {
  const app = createTestApp()
  const auth = await app.inject({
    method: 'POST',
    url: '/api/auth/wechat',
    payload: { code: 'family-stats' },
  })
  const token = auth.json().token
  const data = {
    activeChildId: 'child-a',
    children: [{
      id: 'child-a',
      name: '小宝贝',
      avatar: '👶',
      totalPoints: 12,
      currentStreak: 3,
      lastLoginDate: '2026-05-20',
      tasks: [
        { id: 'task-a', title: '阅读', icon: '📚', points: 5, completed: true, category: { name: '学习' } },
        { id: 'task-b', title: '整理', icon: '🧹', points: -2, completed: true, category: { name: '家务' } },
      ],
      history: { '2026-05-20': 2 },
      dailyHistory: {
        '2026-05-20': {
          date: '2026-05-20',
          totalTasks: 2,
          totalPoints: 3,
          tasks: [
            { id: 'task-a', title: '阅读', icon: '📚', points: 5, category: { name: '学习' }, completedTime: '2026-05-20T01:00:00.000Z' },
            { id: 'task-b', title: '整理', icon: '🧹', points: -2, category: { name: '家务' }, completedTime: '2026-05-20T02:00:00.000Z' },
          ],
        },
      },
      redemptions: [],
      stats: { totalTasksCompleted: 10, totalPointsEarned: 40 },
      unlockedBadges: ['badge-a'],
    }],
  }

  await app.inject({
    method: 'PUT',
    url: '/api/data',
    headers: { authorization: `Bearer ${token}` },
    payload: { data, clientUpdatedAt: '2026-05-20T00:00:00.000Z' },
  })

  const unauthorized = await app.inject({
    method: 'GET',
    url: '/api/admin/users?date=2026-05-20',
  })
  assert.equal(unauthorized.statusCode, 401)

  const usersResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/users?date=2026-05-20',
    headers: { authorization: 'Bearer admin-secret' },
  })
  assert.equal(usersResponse.statusCode, 200)
  assert.equal(usersResponse.json().users.length, 1)
  assert.equal(usersResponse.json().users[0].children[0].todayCompletedTasks, 2)

  const statsResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/users/mock_family-stats/stats?date=2026-05-20',
    headers: { authorization: 'Bearer admin-secret' },
  })
  assert.equal(statsResponse.statusCode, 200)
  assert.equal(statsResponse.json().user.children[0].todayPoints, 3)
  assert.equal(statsResponse.json().user.children[0].completedTasks.length, 2)
  assert.equal(statsResponse.json().user.children[0].recentDays.length, 7)
  assert.equal(statsResponse.json().user.children[0].recentDays.at(-1).completedTasks, 2)
})

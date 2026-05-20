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

import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export const openDatabase = (databasePath) => {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      openid TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_snapshots (
      openid TEXT PRIMARY KEY REFERENCES users(openid) ON DELETE CASCADE,
      data_json TEXT NOT NULL,
      data_version TEXT NOT NULL,
      client_updated_at TEXT NOT NULL,
      server_updated_at TEXT NOT NULL
    );
  `)

  return db
}

export const createRepository = (db) => {
  const upsertUserStatement = db.prepare(`
    INSERT INTO users (openid, created_at, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(openid) DO UPDATE SET updated_at = excluded.updated_at
  `)

  const getSnapshotStatement = db.prepare(`
    SELECT data_json, data_version, client_updated_at, server_updated_at
    FROM user_snapshots
    WHERE openid = ?
  `)

  const listSnapshotsStatement = db.prepare(`
    SELECT u.openid, u.created_at, u.updated_at,
           s.data_json, s.data_version, s.client_updated_at, s.server_updated_at
    FROM users u
    LEFT JOIN user_snapshots s ON s.openid = u.openid
    ORDER BY COALESCE(s.server_updated_at, u.updated_at) DESC
  `)

  const saveSnapshotStatement = db.prepare(`
    INSERT INTO user_snapshots (openid, data_json, data_version, client_updated_at, server_updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(openid) DO UPDATE SET
      data_json = excluded.data_json,
      data_version = excluded.data_version,
      client_updated_at = excluded.client_updated_at,
      server_updated_at = excluded.server_updated_at
  `)

  return {
    upsertUser(openid) {
      const now = new Date().toISOString()
      upsertUserStatement.run(openid, now, now)
    },

    getSnapshot(openid) {
      const row = getSnapshotStatement.get(openid)
      if (!row) return null

      return {
        data: JSON.parse(row.data_json),
        dataVersion: row.data_version,
        clientUpdatedAt: row.client_updated_at,
        serverUpdatedAt: row.server_updated_at,
      }
    },

    listSnapshots() {
      return listSnapshotsStatement.all().map((row) => ({
        openid: row.openid,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        data: row.data_json ? JSON.parse(row.data_json) : null,
        dataVersion: row.data_version,
        clientUpdatedAt: row.client_updated_at,
        serverUpdatedAt: row.server_updated_at,
      }))
    },

    saveSnapshot(openid, { data, dataVersion = 'v6', clientUpdatedAt }) {
      const serverUpdatedAt = new Date().toISOString()
      saveSnapshotStatement.run(
        openid,
        JSON.stringify(data),
        dataVersion,
        clientUpdatedAt || serverUpdatedAt,
        serverUpdatedAt,
      )

      return {
        dataVersion,
        clientUpdatedAt: clientUpdatedAt || serverUpdatedAt,
        serverUpdatedAt,
      }
    },
  }
}

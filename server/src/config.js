import path from 'node:path'

const toBool = (value) => value === 'true' || value === '1'

export const loadConfig = (env = process.env) => {
  const nodeEnv = env.NODE_ENV || 'development'
  const jwtSecret = env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'dev-only-insecure-secret')
  const wechatAuthMock = toBool(env.WECHAT_AUTH_MOCK)

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required in production')
  }

  if (!wechatAuthMock && (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET)) {
    throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET are required unless WECHAT_AUTH_MOCK=true')
  }

  return {
    host: env.HOST || '0.0.0.0',
    port: Number(env.PORT || 3001),
    databasePath: path.resolve(env.DATABASE_PATH || './data/starachiever.sqlite'),
    jwtSecret,
    adminReadToken: env.ADMIN_READ_TOKEN || jwtSecret,
    tokenTtlSeconds: Number(env.JWT_TTL_SECONDS || 7 * 24 * 60 * 60),
    wechatAppId: env.WECHAT_APP_ID || '',
    wechatAppSecret: env.WECHAT_APP_SECRET || '',
    wechatAuthMock,
  }
}

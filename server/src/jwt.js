import crypto from 'node:crypto'

const base64url = (input) => Buffer.from(input).toString('base64url')

const signHmac = (value, secret) => {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export const createToken = ({ openid, secret, ttlSeconds }) => {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: openid,
    iat: now,
    exp: now + ttlSeconds,
  }
  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const signature = signHmac(`${encodedHeader}.${encodedPayload}`, secret)

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  }
}

export const verifyToken = (token, secret) => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const expectedSignature = signHmac(`${encodedHeader}.${encodedPayload}`, secret)
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid token signature')
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid token subject')
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  return payload
}

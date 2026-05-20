import Taro from '@tarojs/taro'

declare const __STARACHIEVER_API_BASE_URL__: string

const TOKEN_KEY = 'starachiever_api_token'
const TOKEN_EXPIRES_AT_KEY = 'starachiever_api_token_expires_at'

type RequestMethod = 'GET' | 'POST' | 'PUT'

interface RequestOptions {
  method?: RequestMethod
  data?: unknown
  auth?: boolean
  retryOnUnauthorized?: boolean
}

interface AuthResponse {
  token: string
  expiresAt: string
  openid: string
}

const API_BASE_URL = (__STARACHIEVER_API_BASE_URL__ || '').replace(/\/$/, '')

const isTokenUsable = (expiresAt?: string) => {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() > Date.now() + 60 * 1000
}

const clearToken = () => {
  Taro.removeStorageSync(TOKEN_KEY)
  Taro.removeStorageSync(TOKEN_EXPIRES_AT_KEY)
}

const loginWithWechat = async (): Promise<string> => {
  const result = await Taro.login()
  if (!result.code) {
    throw new Error('微信登录失败，未获得 code')
  }
  return result.code
}

const requestRaw = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const header: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (options.auth !== false) {
    const token = await getAuthToken()
    header.Authorization = `Bearer ${token}`
  }

  const response = await Taro.request<T>({
    url: `${API_BASE_URL}${path}`,
    method: options.method || 'GET',
    data: options.data as any,
    header,
  })

  if (response.statusCode >= 200 && response.statusCode < 300) {
    return response.data
  }

  if (response.statusCode === 401 && options.retryOnUnauthorized !== false) {
    clearToken()
    return requestRaw<T>(path, { ...options, retryOnUnauthorized: false })
  }

  throw new Error(`API 请求失败：${response.statusCode}`)
}

export const getAuthToken = async (): Promise<string> => {
  const cachedToken = Taro.getStorageSync(TOKEN_KEY)
  const expiresAt = Taro.getStorageSync(TOKEN_EXPIRES_AT_KEY)
  if (cachedToken && isTokenUsable(expiresAt)) {
    return cachedToken
  }

  const code = await loginWithWechat()
  const auth = await requestRaw<AuthResponse>('/api/auth/wechat', {
    method: 'POST',
    data: { code },
    auth: false,
  })

  Taro.setStorageSync(TOKEN_KEY, auth.token)
  Taro.setStorageSync(TOKEN_EXPIRES_AT_KEY, auth.expiresAt)
  return auth.token
}

export const apiClient = {
  get: <T>(path: string) => requestRaw<T>(path, { method: 'GET' }),
  put: <T>(path: string, data: unknown) => requestRaw<T>(path, { method: 'PUT', data }),
}

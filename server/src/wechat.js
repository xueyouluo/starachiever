export const exchangeWechatCode = async ({ code, config }) => {
  if (config.wechatAuthMock) {
    return {
      openid: `mock_${code}`,
      sessionKey: 'mock_session_key',
    }
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', config.wechatAppId)
  url.searchParams.set('secret', config.wechatAppSecret)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')

  const response = await fetch(url)
  const result = await response.json()
  if (!response.ok || result.errcode) {
    const message = result.errmsg || `WeChat auth failed with status ${response.status}`
    throw new Error(message)
  }

  return {
    openid: result.openid,
    sessionKey: result.session_key,
    unionid: result.unionid,
  }
}

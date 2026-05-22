import { createHmac, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'

let browserPromise = null

const clampInt = (value, fallback, min, max) => {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

const escapeXml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const formatPoints = (value) => (value > 0 ? `+${value}` : `${value}`)

const formatTime = (value) => {
  if (typeof value !== 'string') return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''))
  const b = Buffer.from(String(right || ''))
  return a.length === b.length && timingSafeEqual(a, b)
}

export const createEinkUserToken = ({ openid, secret }) => createHmac('sha256', secret)
  .update(openid)
  .digest('hex')

export const verifyEinkUserToken = ({ openid, token, secret }) => safeEqual(
  createEinkUserToken({ openid, secret }),
  token,
)

export const parseEinkOptions = (query = {}) => {
  const width = clampInt(query.width, 400, 200, 1600)
  const height = clampInt(query.height, 300, 100, 1200)
  const page = clampInt(query.page, 0, 0, 20)
  const requestedLayout = ['single', 'split', 'auto'].includes(query.layout) ? query.layout : 'split'
  const layout = requestedLayout === 'auto'
    ? (width >= 640 && height >= 240 ? 'split' : 'single')
    : requestedLayout

  return {
    width,
    height,
    page,
    layout,
    date: query.date,
  }
}

export const createEinkStatus = ({ snapshot, dateKey, options, summarizeSnapshot }) => {
  const summary = summarizeSnapshot(snapshot, dateKey)
  const children = summary.children.map((child) => ({
    id: child.id,
    name: child.name,
    avatar: child.avatar,
    totalPoints: child.totalPoints,
    todayCompletedTasks: child.todayCompletedTasks,
    totalTasks: child.totalTasks,
    todayPoints: child.todayPoints,
    currentStreak: child.currentStreak,
    recentDays: child.recentDays.map((day) => ({
      date: day.date,
      completedTasks: day.completedTasks,
    })),
    recentTasks: child.completedTasks.slice(0, 4).map((task) => ({
      title: task.title,
      points: task.points,
      completedTime: task.completedTime,
      timeText: formatTime(task.completedTime),
    })),
  }))

  const visibleChildren = options.layout === 'split'
    ? children.slice(0, 2)
    : children.length > 0
      ? [children[options.page % children.length]]
      : []

  return {
    date: dateKey,
    serverUpdatedAt: summary.serverUpdatedAt,
    layout: options.layout,
    page: options.page,
    width: options.width,
    height: options.height,
    palette: 'black-white-red',
    children,
    visibleChildren,
  }
}

export const renderEinkHtml = (status) => {
  const { width, height, visibleChildren } = status
  const split = status.layout === 'split' && visibleChildren.length > 1
  const screenPadding = Math.max(8, Math.floor(Math.min(width, height) * 0.035))
  const headerHeight = Math.max(20, Math.floor(height * 0.095))
  const gridGap = Math.max(6, Math.floor(Math.min(width, height) * 0.028))

  const childCards = visibleChildren.map((child) => {
    const maxChartValue = Math.max(1, ...child.recentDays.map((day) => day.completedTasks))
    const chartBars = child.recentDays.map((day, index) => {
      const heightPercent = Math.max(day.completedTasks > 0 ? 8 : 0, Math.round((day.completedTasks / maxChartValue) * 100))
      const isToday = index === child.recentDays.length - 1
      return `
        <div class="chart-day">
          <span class="${isToday ? 'red' : ''}">${escapeXml(day.completedTasks)}</span>
          <div class="bar ${isToday ? 'today-bar' : ''}" style="height:${heightPercent}%"></div>
        </div>
      `
    }).join('')
    const taskRows = child.recentTasks.slice(0, 4).map((task) => `
      <div class="task-row">
        <span>${escapeXml(`${task.timeText} ${task.title}`)}</span>
        <strong class="${task.points < 0 ? 'red' : ''}">${escapeXml(formatPoints(task.points))}</strong>
      </div>
    `).join('')

    return `
      <section class="child-card">
        <div class="child-head">
          <h2>${escapeXml(`${child.avatar || ''} ${child.name}`)}</h2>
          <div class="today">今日 ${child.todayCompletedTasks}/${child.totalTasks}</div>
        </div>
        <div class="score-row">
          <div class="points">${escapeXml(child.totalPoints)}</div>
          <div class="score-meta">
            <div class="${child.todayPoints < 0 ? 'red' : ''}">积分 ${escapeXml(formatPoints(child.todayPoints))}</div>
            <div>连续 ${escapeXml(child.currentStreak)} 天</div>
          </div>
        </div>
        <div class="chart-block">
          <div class="chart-title">近7天任务完成数量</div>
          <div class="chart-bars">${chartBars}</div>
        </div>
        <div class="tasks">${taskRows || '<div class="empty">今天还没有任务明细</div>'}</div>
      </section>
    `
  }).join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #fff;
      color: #000;
      font-family: -apple-system, BlinkMacSystemFont, "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif;
    }
    .screen {
      width: ${width}px;
      height: ${height}px;
      padding: ${screenPadding}px;
      background: #fff;
    }
    .topbar {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      height: ${headerHeight}px;
      border-bottom: 2px solid #000;
      font-weight: 900;
    }
    .brand {
      font-size: ${Math.max(15, Math.floor(height * 0.055))}px;
      line-height: 1;
    }
    .sync {
      font-size: ${Math.max(10, Math.floor(height * 0.034))}px;
      line-height: 1;
    }
    .grid {
      display: grid;
      grid-template-columns: ${split ? '1fr 1fr' : '1fr'};
      gap: ${gridGap}px;
      height: calc(100% - ${headerHeight}px);
      padding-top: ${gridGap}px;
    }
    .child-card {
      min-width: 0;
      border: 4px solid #000;
      padding: ${Math.max(9, Math.floor(Math.min(width, height) * 0.035))}px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .child-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    h2 {
      margin: 0;
      min-width: 0;
      font-size: ${Math.max(20, Math.min(44, Math.floor((split ? width / 2 : width) * 0.072)))}px;
      line-height: 1.05;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .today {
      flex: 0 0 auto;
      font-size: ${Math.max(13, Math.min(26, Math.floor((split ? width / 2 : width) * 0.038)))}px;
      font-weight: 900;
      line-height: 1.15;
      padding-top: 4px;
    }
    .score-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
      margin-top: ${Math.max(6, Math.floor(height * 0.025))}px;
      padding-bottom: ${Math.max(5, Math.floor(height * 0.018))}px;
      border-bottom: 3px solid #000;
    }
    .points {
      color: #f00;
      font-size: ${Math.max(40, Math.min(88, Math.floor((split ? width / 2 : width) * 0.16)))}px;
      line-height: 0.88;
      font-weight: 1000;
    }
    .score-meta {
      text-align: right;
      font-size: ${Math.max(13, Math.min(26, Math.floor((split ? width / 2 : width) * 0.038)))}px;
      line-height: 1.25;
      font-weight: 900;
      white-space: nowrap;
    }
    .red { color: #f00; }
    .chart-block {
      margin-top: ${Math.max(5, Math.floor(height * 0.016))}px;
      padding-bottom: ${Math.max(4, Math.floor(height * 0.012))}px;
      border-bottom: 3px solid #000;
    }
    .chart-title {
      font-size: ${Math.max(11, Math.min(18, Math.floor((split ? width / 2 : width) * 0.028)))}px;
      line-height: 1;
      font-weight: 900;
      margin-bottom: 3px;
    }
    .chart-bars {
      height: ${Math.max(30, Math.min(54, Math.floor(height * 0.17)))}px;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      align-items: end;
      gap: ${Math.max(3, Math.floor((split ? width / 2 : width) * 0.012))}px;
      border-bottom: 2px solid #000;
    }
    .chart-day {
      height: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 1px;
    }
    .chart-day span {
      font-size: ${Math.max(9, Math.min(15, Math.floor((split ? width / 2 : width) * 0.024)))}px;
      line-height: 1;
      font-weight: 900;
    }
    .bar {
      width: 100%;
      min-height: 0;
      background: #000;
    }
    .today-bar {
      background: #f00;
    }
    .tasks {
      min-height: 0;
      padding-top: ${Math.max(4, Math.floor(height * 0.012))}px;
      overflow: hidden;
    }
    .task-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      font-size: ${Math.max(12, Math.min(22, Math.floor((split ? width / 2 : width) * 0.033)))}px;
      line-height: 1.32;
      font-weight: 800;
      border-bottom: 2px solid #000;
      padding: 2px 0;
    }
    .task-row span {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .empty {
      font-size: ${Math.max(13, Math.min(22, Math.floor((split ? width / 2 : width) * 0.034)))}px;
      font-weight: 800;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <main class="screen">
    <header class="topbar">
      <div class="brand">打卡之星 ${escapeXml(status.date)}</div>
      <div class="sync">同步 ${escapeXml(formatTime(status.serverUpdatedAt))}</div>
    </header>
    <div class="grid">${childCards || '<div class="empty">暂无儿童数据</div>'}</div>
  </main>
</body>
</html>`
}

const findChromeExecutablePath = (configuredPath) => {
  const candidates = [
    configuredPath,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)

  return candidates.find((candidate) => fs.existsSync(candidate)) || ''
}

const getBrowser = async (chromeExecutablePath) => {
  const executablePath = findChromeExecutablePath(chromeExecutablePath)
  if (!executablePath) {
    throw new Error('Chrome executable not found')
  }

  if (!browserPromise) {
    const puppeteer = await import('puppeteer-core')
    browserPromise = puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    })
  }

  return browserPromise
}

export const renderEinkPng = async ({ status, chromeExecutablePath }) => {
  const browser = await getBrowser(chromeExecutablePath)
  const page = await browser.newPage()
  try {
    await page.setViewport({
      width: status.width,
      height: status.height,
      deviceScaleFactor: 1,
    })
    await page.setContent(renderEinkHtml(status), { waitUntil: 'networkidle0' })
    return await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: status.width, height: status.height },
    })
  } finally {
    await page.close()
  }
}

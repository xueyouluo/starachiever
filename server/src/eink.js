import { createHmac, timingSafeEqual } from 'node:crypto'
import fs from 'node:fs'
import { PNG } from 'pngjs'

let browserPromise = null

const EINK_BLACK = [0, 0, 0, 255]
const EINK_WHITE = [255, 255, 255, 255]
const EINK_RED = [255, 0, 0, 255]
const EINK_YELLOW = [255, 255, 0, 255]

const DEFAULT_EINK_PANEL = 'epd-4in2-bwr'
const EINK_PANELS = Object.freeze({
  [DEFAULT_EINK_PANEL]: {
    id: DEFAULT_EINK_PANEL,
    width: 400,
    height: 300,
    palette: 'black-white-red',
    nativeFormat: 'bwr-planes-1bpp',
    layout: 'split',
  },
  gdem075f52: {
    id: 'gdem075f52',
    width: 800,
    height: 480,
    palette: 'black-white-yellow-red',
    nativeFormat: 'acep-2bpp',
    layout: 'split',
  },
})

const getEinkPanel = (panel) => EINK_PANELS[panel] || EINK_PANELS[DEFAULT_EINK_PANEL]

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

export const quantizeEinkPng = (source, palette = EINK_PANELS[DEFAULT_EINK_PANEL].palette) => {
  const image = PNG.sync.read(source)
  const { data } = image
  const hasYellow = palette.includes('yellow')

  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3] / 255
    const red = Math.round(data[offset] * alpha + 255 * (1 - alpha))
    const green = Math.round(data[offset + 1] * alpha + 255 * (1 - alpha))
    const blue = Math.round(data[offset + 2] * alpha + 255 * (1 - alpha))
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000
    const isRed = red >= 128 && red - green >= 48 && red - blue >= 48
    const isYellow = hasYellow && red >= 160 && green >= 128 && blue <= 128 &&
      red - blue >= 48 && green - blue >= 48
    const ink = isYellow ? EINK_YELLOW : isRed ? EINK_RED : luminance < 132 ? EINK_BLACK : EINK_WHITE

    data[offset] = ink[0]
    data[offset + 1] = ink[1]
    data[offset + 2] = ink[2]
    data[offset + 3] = ink[3]
  }

  return PNG.sync.write(image)
}

const isPixel = (data, offset, red, green, blue) => (
  data[offset] === red && data[offset + 1] === green && data[offset + 2] === blue
)

export const packEinkFrame = ({ source, panel = DEFAULT_EINK_PANEL }) => {
  const profile = getEinkPanel(panel)
  const image = PNG.sync.read(source)
  const { width, height, data } = image

  if (profile.nativeFormat === 'acep-2bpp') {
    const frame = Buffer.alloc(Math.ceil(width / 4) * height, 0x55)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4
        const value = isPixel(data, offset, 0, 0, 0) ? 0x00
          : isPixel(data, offset, 255, 255, 0) ? 0x02
            : isPixel(data, offset, 255, 0, 0) ? 0x03
              : 0x01
        const frameOffset = y * Math.ceil(width / 4) + Math.floor(x / 4)
        const shift = 6 - (x % 4) * 2
        frame[frameOffset] = (frame[frameOffset] & ~(0x03 << shift)) | (value << shift)
      }
    }
    return frame
  }

  const bytesPerRow = Math.ceil(width / 8)
  const planeBytes = bytesPerRow * height
  const frame = Buffer.alloc(planeBytes * 2, 0xFF)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const mask = 0x80 >> (x % 8)
      const planeOffset = y * bytesPerRow + Math.floor(x / 8)
      if (isPixel(data, offset, 0, 0, 0)) frame[planeOffset] &= ~mask
      if (isPixel(data, offset, 255, 0, 0)) frame[planeBytes + planeOffset] &= ~mask
    }
  }
  return frame
}

export const usesNativeEinkSize = ({ panel, width, height }) => {
  const profile = getEinkPanel(panel)
  return profile.width === width && profile.height === height
}

export const createEinkUserToken = ({ openid, secret }) => createHmac('sha256', secret)
  .update(openid)
  .digest('hex')

export const verifyEinkUserToken = ({ openid, token, secret }) => safeEqual(
  createEinkUserToken({ openid, secret }),
  token,
)

export const parseEinkOptions = (query = {}) => {
  const panel = getEinkPanel(query.panel)
  const width = clampInt(query.width, panel.width, 200, 1600)
  const height = clampInt(query.height, panel.height, 100, 1200)
  const page = clampInt(query.page, 0, 0, 20)
  const requestedLayout = ['single', 'split', 'auto'].includes(query.layout) ? query.layout : panel.layout
  const layout = requestedLayout === 'auto'
    ? (width >= 640 && height >= 240 ? 'split' : 'single')
    : requestedLayout

  return {
    panel: panel.id,
    palette: panel.palette,
    nativeFormat: panel.nativeFormat,
    width,
    height,
    page,
    layout,
    date: query.date,
  }
}

export const createEinkStatus = ({ snapshot, dateKey, options, summarizeSnapshot }) => {
  const summary = summarizeSnapshot(snapshot, dateKey)
  const children = summary.children.map((child) => {
    const recentDays = child.recentDays.map((day) => ({
      date: day.date,
      completedTasks: day.completedTasks,
    }))
    const completedTasks = child.completedTasks || []

    return {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      totalPoints: child.totalPoints,
      todayCompletedTasks: child.todayCompletedTasks,
      totalTasks: child.totalTasks,
      todayPoints: child.todayPoints,
      todayEarned: completedTasks.reduce((sum, task) => sum + Math.max(0, task.points), 0),
      todayDeducted: completedTasks.reduce((sum, task) => sum + Math.abs(Math.min(0, task.points)), 0),
      hasTodayTaskDetails: completedTasks.length > 0,
      currentStreak: child.currentStreak,
      todayRedemptions: child.todayRedemptions,
      weekCompleted: recentDays.reduce((sum, day) => sum + day.completedTasks, 0),
      recentDays,
      recentTasks: completedTasks.slice(0, 4).map((task) => ({
        title: task.title,
        points: task.points,
        completedTime: task.completedTime,
        timeText: formatTime(task.completedTime),
      })),
    }
  })

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
    panel: options.panel,
    palette: options.palette,
    nativeFormat: options.nativeFormat,
    children,
    visibleChildren,
  }
}

const renderLargeEinkHtml = (status) => {
  const visibleChildren = status.visibleChildren
  const familyCompleted = status.children.reduce((sum, child) => sum + child.todayCompletedTasks, 0)
  const familyPoints = status.children.reduce((sum, child) => sum + child.totalPoints, 0)
  const familyTodayPoints = status.children.reduce((sum, child) => sum + child.todayPoints, 0)
  const children = visibleChildren.map((child) => {
    const maxChartValue = Math.max(1, ...child.recentDays.map((day) => day.completedTasks))
    const chartBars = child.recentDays.map((day, index) => {
      const percent = Math.max(day.completedTasks > 0 ? 10 : 0, Math.round(day.completedTasks / maxChartValue * 100))
      const isToday = index === child.recentDays.length - 1
      return `
        <div class="wide-day">
          <b class="${isToday ? 'red' : ''}">${escapeXml(day.completedTasks)}</b>
          <span class="wide-bar ${isToday ? 'red-bg' : ''}" style="height:${percent}%"></span>
          <small>${escapeXml(day.date.slice(5))}</small>
        </div>
      `
    }).join('')
    const detailScore = child.hasTodayTaskDetails || child.todayCompletedTasks === 0
      ? `
          <div class="metric"><label>今日得分</label><strong>+${escapeXml(child.todayEarned)}</strong></div>
          <div class="metric deduction"><label>今日扣分</label><strong>-${escapeXml(child.todayDeducted)}</strong></div>
        `
      : `
          <div class="metric"><label>任务净分</label><strong class="${child.todayPoints < 0 ? 'red' : ''}">${escapeXml(formatPoints(child.todayPoints))}</strong></div>
          <div class="metric"><label>明细</label><strong>待同步</strong></div>
        `
    const tasks = child.recentTasks.slice(0, 3).map((task) => `
      <div class="wide-task">
        <span>${escapeXml(`${task.timeText}  ${task.title}`)}</span>
        <strong class="${task.points < 0 ? 'red' : ''}">${escapeXml(formatPoints(task.points))}</strong>
      </div>
    `).join('')

    return `
      <section class="wide-child">
        <div class="wide-name">
          <h2>${escapeXml(child.name)}</h2>
          <div class="wide-total"><span>当前积分</span><b>${escapeXml(child.totalPoints)}</b></div>
        </div>
        <div class="metrics">
          <div class="metric highlight"><label>今日完成</label><strong>${escapeXml(child.todayCompletedTasks)}/${escapeXml(child.totalTasks)}</strong></div>
          ${detailScore}
          <div class="metric"><label>连续打卡</label><strong>${escapeXml(child.currentStreak)}天</strong></div>
        </div>
        <div class="wide-chart">
          <div class="section-head"><span>近 7 天完成趋势</span><b>本周 ${escapeXml(child.weekCompleted)} 次</b></div>
          <div class="wide-bars">${chartBars}</div>
        </div>
        <div class="wide-tasks">
          <div class="section-head">
            <span>今日最近完成</span>
            <b>${escapeXml(child.todayCompletedTasks)} 项${child.todayRedemptions > 0 ? ` · 兑换 ${escapeXml(child.todayRedemptions)} 次` : ''}</b>
          </div>
          ${tasks || '<div class="wide-empty">今天暂无任务明细</div>'}
        </div>
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
      width: ${status.width}px;
      height: ${status.height}px;
      overflow: hidden;
      background: #fff;
      color: #000;
      font-family: "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif;
    }
    .wide-screen {
      width: ${status.width}px;
      height: ${status.height}px;
      padding: 14px 18px;
      background: #fff;
    }
    .wide-header {
      height: 54px;
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      border-bottom: 3px solid #000;
    }
    .wide-brand {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 17px 0 13px;
      background: #ff0;
      font-weight: 800;
    }
    .wide-brand h1 { margin: 0; font-size: 26px; line-height: 1; }
    .wide-brand span { font-size: 16px; font-weight: 700; }
    .family-summary {
      display: flex;
      align-items: center;
      gap: 22px;
      font-weight: 700;
      font-size: 13px;
    }
    .family-summary strong { font-size: 21px; margin-left: 5px; }
    .family-summary .red { color: #f00; }
    .family-summary small { font-size: 12px; font-weight: 700; }
    .wide-grid {
      display: grid;
      grid-template-columns: ${visibleChildren.length > 1 ? '1fr 1fr' : '1fr'};
      gap: 18px;
      height: calc(100% - 54px);
      padding-top: 12px;
    }
    .wide-child {
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 2px solid #000;
      padding: 10px 12px;
    }
    .wide-name {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 50px;
      border-bottom: 2px solid #000;
    }
    .wide-name h2 { margin: 0; font-size: 26px; font-weight: 800; line-height: 1; }
    .wide-total { display: flex; align-items: baseline; gap: 7px; font-weight: 700; }
    .wide-total span { font-size: 12px; }
    .wide-total b { color: #f00; font-size: 42px; line-height: 1; font-weight: 800; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin-top: 8px;
    }
    .metric {
      min-width: 0;
      height: 47px;
      padding: 5px 4px;
      border: 1px solid #000;
      text-align: center;
      font-weight: 700;
    }
    .metric label { display: block; font-size: 10px; line-height: 1; }
    .metric strong { display: block; margin-top: 5px; font-size: 18px; line-height: 1; }
    .metric.highlight { background: #ff0; }
    .metric.deduction strong, .red { color: #f00; }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 5px;
      font-size: 12px;
      font-weight: 800;
    }
    .section-head b { font-size: 12px; }
    .wide-chart { margin-top: 9px; }
    .wide-bars {
      height: 84px;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      border-bottom: 2px solid #000;
    }
    .wide-day {
      height: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .wide-day b { font-size: 11px; line-height: 1; margin-bottom: 2px; }
    .wide-day small { height: 13px; margin-top: 3px; font-size: 9px; font-weight: 700; line-height: 1; }
    .wide-bar { display: block; width: 100%; min-height: 0; background: #000; }
    .red-bg { background: #f00; }
    .wide-tasks {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px solid #000;
      min-height: 0;
      overflow: hidden;
    }
    .wide-task {
      height: 24px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid #000;
      font-size: 13px;
      font-weight: 700;
      line-height: 23px;
    }
    .wide-task span {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .wide-empty { font-size: 13px; font-weight: 700; padding-top: 12px; }
  </style>
</head>
<body>
  <main class="wide-screen">
    <header class="wide-header">
      <div class="wide-brand"><h1>打卡之星</h1><span>${escapeXml(status.date)}</span></div>
      <div class="family-summary">
        <span>家庭积分 <strong class="red">${escapeXml(familyPoints)}</strong></span>
        <span>今日完成 <strong>${escapeXml(familyCompleted)}</strong></span>
        <span>任务净分 <strong class="${familyTodayPoints < 0 ? 'red' : ''}">${escapeXml(formatPoints(familyTodayPoints))}</strong></span>
        <small>同步 ${escapeXml(formatTime(status.serverUpdatedAt))}</small>
      </div>
    </header>
    <div class="wide-grid">${children || '<div class="wide-empty">暂无儿童数据</div>'}</div>
  </main>
</body>
</html>`
}

export const renderEinkHtml = (status) => {
  if (status.panel === 'gdem075f52' && status.width >= 760 && status.height >= 450) {
    return renderLargeEinkHtml(status)
  }

  const { width, height, visibleChildren } = status
  const headerBackground = status.palette.includes('yellow') ? '#ff0' : '#fff'
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
          <h2>${escapeXml(child.name)}</h2>
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
      background: ${headerBackground};
      font-weight: 800;
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
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .today {
      flex: 0 0 auto;
      font-size: ${Math.max(14, Math.min(26, Math.floor((split ? width / 2 : width) * 0.038)))}px;
      font-weight: 700;
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
      font-weight: 800;
    }
    .score-meta {
      text-align: right;
      font-size: ${Math.max(14, Math.min(26, Math.floor((split ? width / 2 : width) * 0.038)))}px;
      line-height: 1.25;
      font-weight: 700;
      white-space: nowrap;
    }
    .red { color: #f00; }
    .chart-block {
      margin-top: ${Math.max(5, Math.floor(height * 0.016))}px;
      padding-bottom: ${Math.max(4, Math.floor(height * 0.012))}px;
      border-bottom: 3px solid #000;
    }
    .chart-title {
      font-size: ${Math.max(12, Math.min(18, Math.floor((split ? width / 2 : width) * 0.028)))}px;
      line-height: 1;
      font-weight: 700;
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
      font-size: ${Math.max(10, Math.min(15, Math.floor((split ? width / 2 : width) * 0.024)))}px;
      line-height: 1;
      font-weight: 700;
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
      font-size: ${Math.max(13, Math.min(22, Math.floor((split ? width / 2 : width) * 0.033)))}px;
      line-height: 1.32;
      font-weight: 700;
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
      font-size: ${Math.max(14, Math.min(22, Math.floor((split ? width / 2 : width) * 0.034)))}px;
      font-weight: 700;
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
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: status.width, height: status.height },
    })
    return quantizeEinkPng(screenshot, status.palette)
  } finally {
    await page.close()
  }
}

export const renderEinkFrame = async ({ status, chromeExecutablePath }) => {
  const png = await renderEinkPng({ status, chromeExecutablePath })
  return packEinkFrame({ source: png, panel: status.panel })
}

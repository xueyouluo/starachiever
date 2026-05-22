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
  const width = clampInt(query.width, 792, 200, 1600)
  const height = clampInt(query.height, 272, 100, 1200)
  const page = clampInt(query.page, 0, 0, 20)
  const requestedLayout = ['single', 'split', 'auto'].includes(query.layout) ? query.layout : 'auto'
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

const drawText = ({ x, y, size, weight = 700, color = 'black', text, anchor = 'start' }) => (
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${color}">${escapeXml(text)}</text>`
)

const drawChildPanel = ({ child, x, y, width, height }) => {
  const padding = Math.max(10, Math.floor(Math.min(width, height) * 0.055))
  const titleSize = Math.max(20, Math.min(42, Math.floor(width * 0.075)))
  const pointsSize = Math.max(38, Math.min(82, Math.floor(width * 0.16)))
  const statSize = Math.max(14, Math.min(28, Math.floor(width * 0.044)))
  const taskSize = Math.max(12, Math.min(22, Math.floor(width * 0.037)))
  const chartHeight = Math.max(34, Math.min(54, Math.floor(height * 0.22)))
  const taskStartY = y + padding + titleSize + pointsSize + statSize + chartHeight + 26
  const maxTasks = Math.max(0, Math.min(4, Math.floor((y + height - taskStartY - padding) / (taskSize + 8))))
  const maxChartValue = Math.max(1, ...child.recentDays.map((day) => day.completedTasks))
  const chartX = x + padding
  const chartY = y + padding + titleSize + pointsSize + statSize + 12
  const chartWidth = width - padding * 2
  const barGap = Math.max(3, Math.floor(chartWidth * 0.012))
  const barWidth = Math.max(6, Math.floor((chartWidth - barGap * 6) / 7))
  const chartBars = child.recentDays.map((day, index) => {
    const barHeight = Math.max(day.completedTasks > 0 ? 3 : 0, Math.floor((day.completedTasks / maxChartValue) * (chartHeight - 18)))
    const barX = chartX + index * (barWidth + barGap)
    const barY = chartY + chartHeight - 8 - barHeight
    const color = index === child.recentDays.length - 1 ? 'red' : 'black'
    return `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}"/>
      ${drawText({ x: barX + barWidth / 2, y: chartY + chartHeight - 10 - barHeight, size: 10, weight: 800, color, text: day.completedTasks, anchor: 'middle' })}
    `
  }).join('')

  const tasks = child.recentTasks.slice(0, maxTasks)
  const taskLines = tasks.map((task, index) => {
    const lineY = taskStartY + index * (taskSize + 8)
    const pointColor = task.points < 0 ? 'red' : 'black'
    return [
      drawText({ x: x + padding, y: lineY, size: taskSize, weight: 600, color: 'black', text: `${task.timeText} ${task.title}` }),
      drawText({ x: x + width - padding, y: lineY, size: taskSize, weight: 800, color: pointColor, text: formatPoints(task.points), anchor: 'end' }),
    ].join('')
  }).join('')

  return `
    <rect x="${x + 2}" y="${y + 2}" width="${width - 4}" height="${height - 4}" fill="white" stroke="black" stroke-width="3"/>
    ${drawText({ x: x + padding, y: y + padding + titleSize, size: titleSize, text: `${child.avatar || ''} ${child.name}` })}
    ${drawText({ x: x + padding, y: y + padding + titleSize + pointsSize, size: pointsSize, color: 'red', text: child.totalPoints })}
    ${drawText({ x: x + width - padding, y: y + padding + titleSize + Math.floor(pointsSize * 0.65), size: statSize, anchor: 'end', text: `今日 ${child.todayCompletedTasks}/${child.totalTasks}` })}
    ${drawText({ x: x + width - padding, y: y + padding + titleSize + pointsSize, size: statSize, color: child.todayPoints < 0 ? 'red' : 'black', anchor: 'end', text: `积分 ${formatPoints(child.todayPoints)}` })}
    ${drawText({ x: x + padding, y: y + padding + titleSize + pointsSize + statSize, size: statSize, text: `连续 ${child.currentStreak} 天` })}
    ${drawText({ x: chartX, y: chartY + 10, size: 10, weight: 800, text: '近7天完成数' })}
    <line x1="${chartX}" y1="${chartY + chartHeight - 8}" x2="${chartX + chartWidth}" y2="${chartY + chartHeight - 8}" stroke="black" stroke-width="1"/>
    ${chartBars}
    ${tasks.length > 0 ? taskLines : drawText({ x: x + padding, y: taskStartY, size: taskSize, weight: 600, color: 'black', text: '今天还没有任务明细' })}
  `
}

export const renderEinkSvg = (status) => {
  const { width, height, visibleChildren } = status
  const margin = Math.max(8, Math.floor(Math.min(width, height) * 0.035))
  const headerHeight = Math.max(28, Math.floor(height * 0.13))
  const panelY = margin + headerHeight
  const panelHeight = height - panelY - margin
  const gap = margin
  const isSplit = status.layout === 'split' && visibleChildren.length > 1
  const panelWidth = isSplit ? Math.floor((width - margin * 2 - gap) / 2) : width - margin * 2

  const panels = visibleChildren.map((child, index) => drawChildPanel({
    child,
    x: margin + index * (panelWidth + gap),
    y: panelY,
    width: panelWidth,
    height: panelHeight,
  })).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  ${drawText({ x: margin, y: margin + Math.floor(headerHeight * 0.62), size: Math.max(18, Math.floor(headerHeight * 0.48)), text: `StarAchiever ${status.date}` })}
  ${drawText({ x: width - margin, y: margin + Math.floor(headerHeight * 0.62), size: Math.max(12, Math.floor(headerHeight * 0.32)), weight: 600, anchor: 'end', text: `同步 ${formatTime(status.serverUpdatedAt)}` })}
  ${panels || drawText({ x: width / 2, y: height / 2, size: 24, anchor: 'middle', text: '暂无儿童数据' })}
</svg>`
}

export const renderEinkHtml = (status) => {
  const { width, height, visibleChildren } = status
  const split = status.layout === 'split' && visibleChildren.length > 1

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
      padding: ${Math.max(8, Math.floor(Math.min(width, height) * 0.035))}px;
      background: #fff;
    }
    .topbar {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      height: ${Math.max(28, Math.floor(height * 0.13))}px;
      border-bottom: 3px solid #000;
      font-weight: 900;
    }
    .brand {
      font-size: ${Math.max(18, Math.floor(height * 0.08))}px;
      line-height: 1;
    }
    .sync {
      font-size: ${Math.max(12, Math.floor(height * 0.042))}px;
      line-height: 1;
    }
    .grid {
      display: grid;
      grid-template-columns: ${split ? '1fr 1fr' : '1fr'};
      gap: ${Math.max(8, Math.floor(Math.min(width, height) * 0.035))}px;
      height: calc(100% - ${Math.max(28, Math.floor(height * 0.13))}px);
      padding-top: ${Math.max(8, Math.floor(Math.min(width, height) * 0.035))}px;
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
      <div class="brand">StarAchiever ${escapeXml(status.date)}</div>
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

import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_API_BASE_URL = (import.meta as any).env?.VITE_STARACHIEVER_API_BASE_URL || 'https://stars.followllm.online';
const TOKEN_STORAGE_KEY = 'starachiever_stats_admin_token';
const API_STORAGE_KEY = 'starachiever_stats_api_base_url';
const EINK_DEVICE_TOKEN_STORAGE_KEY = 'starachiever_eink_device_token';

interface ChildStats {
  id: string;
  name: string;
  avatar?: string;
  totalPoints: number;
  currentStreak: number;
  lastLoginDate: string | null;
  totalTasks: number;
  currentCompletedTasks: number;
  todayCompletedTasks: number;
  todayPoints: number;
  todayRedemptions: number;
  totalRedemptions: number;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  unlockedBadges: number;
  completedTasks: Array<{
    id: string;
    title: string;
    icon?: string;
    points: number;
    category: string;
    completedTime?: string | null;
  }>;
  recentDays: Array<{
    date: string;
    completedTasks: number;
    points: number;
  }>;
  detailSource: 'dailyHistory' | 'currentTasks' | 'summaryOnly' | 'none';
}

interface UserSummary {
  openid: string;
  createdAt: string;
  updatedAt: string;
  clientUpdatedAt: string | null;
  serverUpdatedAt: string | null;
  childrenCount: number;
  children: Array<Pick<ChildStats, 'id' | 'name' | 'avatar' | 'totalPoints' | 'todayCompletedTasks' | 'todayPoints' | 'currentStreak'>>;
}

interface UserStats {
  openid: string;
  createdAt: string;
  updatedAt: string;
  clientUpdatedAt: string | null;
  serverUpdatedAt: string | null;
  activeChildId: string | null;
  childrenCount: number;
  children: ChildStats[];
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatTime = (value?: string | null) => {
  if (!value) return '暂无';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
};

const formatTaskTime = (value?: string | null) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatPoints = (value: number) => value > 0 ? `+${value}` : `${value}`;

const maskOpenid = (openid: string) => {
  if (openid.length <= 12) return openid;
  return `${openid.slice(0, 8)}...${openid.slice(-6)}`;
};

const RecentTasksChart: React.FC<{ days: ChildStats['recentDays'] }> = ({ days }) => {
  const width = 560;
  const height = 176;
  const padding = { top: 18, right: 18, bottom: 38, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxTasks = Math.max(1, ...days.map(day => day.completedTasks));
  const points = days.map((day, index) => {
    const x = padding.left + (days.length === 1 ? 0 : (chartWidth * index) / (days.length - 1));
    const y = padding.top + chartHeight - (day.completedTasks / maxTasks) * chartHeight;
    return { ...day, x, y };
  });
  const linePoints = points.map(point => `${point.x},${point.y}`).join(' ');
  const yTicks = Array.from(new Set([0, Math.ceil(maxTasks / 2), maxTasks]));

  return (
    <div className="mt-4 rounded-md border border-gray-100 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">最近 7 天任务完成数量</p>
        <p className="text-xs text-gray-500">单位：个任务</p>
      </div>
      <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="最近 7 天任务完成数量折线图">
        <rect x="0" y="0" width={width} height={height} rx="8" fill="#FAFAF9" />
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / maxTasks) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E5E7EB" strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6B7280">{tick}</text>
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" stroke="#FF6348" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="5" fill="#FF6348" />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F2933">
              {point.completedTasks}
            </text>
            <text x={point.x} y={height - 16} textAnchor="middle" fontSize="11" fill="#6B7280">
              {point.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const DailyTaskGroups: React.FC<{ child: ChildStats }> = ({ child }) => {
  const positiveTasks = child.completedTasks.filter(task => task.points > 0);
  const negativeTasks = child.completedTasks.filter(task => task.points < 0);
  const zeroPointTasks = child.completedTasks.filter(task => task.points === 0);

  const renderTaskGroup = (
    title: string,
    tasks: ChildStats['completedTasks'],
    tone: 'positive' | 'negative' | 'neutral',
  ) => {
    const total = tasks.reduce((sum, task) => sum + task.points, 0);
    const titleColor = tone === 'positive' ? 'text-green-700' : tone === 'negative' ? 'text-red-600' : 'text-gray-600';
    const badgeColor = tone === 'positive' ? 'bg-green-50 text-green-700' : tone === 'negative' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600';

    return (
      <section className="rounded-md border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
          <h4 className={`text-sm font-bold ${titleColor}`}>{title}</h4>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeColor}`}>
            {tasks.length} 项 · {formatPoints(total)}
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500">无记录</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div key={`${child.id}-${title}-${task.id}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{task.icon || '⭐'} {task.title}</span>
                <span className="shrink-0 tabular-nums text-xs font-semibold text-gray-500">{formatTaskTime(task.completedTime)}</span>
                <span className={`font-bold ${task.points < 0 ? 'text-red-600' : task.points > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {formatPoints(task.points)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-700">当天任务明细</h4>
        <span className="text-xs text-gray-500">按积分类型分组</span>
      </div>
      {child.completedTasks.length === 0 ? (
        <div className="rounded-md border border-gray-100 px-3 py-4 text-sm text-gray-500">
          {child.todayCompletedTasks > 0 || child.todayPoints !== 0
            ? `这一天有汇总记录：完成 ${child.todayCompletedTasks} 个任务，积分变化 ${formatPoints(child.todayPoints)}，但旧数据没有保存任务明细。`
            : '这一天还没有完成任务。'}
        </div>
      ) : (
        <div className="grid gap-3">
          {renderTaskGroup('得分任务', positiveTasks, 'positive')}
          {renderTaskGroup('扣分任务', negativeTasks, 'negative')}
          {zeroPointTasks.length > 0 && renderTaskGroup('零分任务', zeroPointTasks, 'neutral')}
        </div>
      )}
    </div>
  );
};

const StatsDashboard: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem(API_STORAGE_KEY) || DEFAULT_API_BASE_URL);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [einkDeviceToken, setEinkDeviceToken] = useState(() => localStorage.getItem(EINK_DEVICE_TOKEN_STORAGE_KEY) || '');
  const [einkWidth, setEinkWidth] = useState(400);
  const [einkHeight, setEinkHeight] = useState(300);
  const [einkLayout, setEinkLayout] = useState<'auto' | 'single' | 'split'>('split');
  const [einkPage, setEinkPage] = useState(0);
  const [einkUserToken, setEinkUserToken] = useState('');
  const [einkImageUrl, setEinkImageUrl] = useState('');
  const [isLoadingEink, setIsLoadingEink] = useState(false);
  const [einkError, setEinkError] = useState('');
  const [date, setDate] = useState(todayKey());
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedOpenid, setSelectedOpenid] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState('');

  const normalizedApiBaseUrl = useMemo(() => apiBaseUrl.replace(/\/$/, ''), [apiBaseUrl]);
  const selectedSummary = users.find(user => user.openid === selectedOpenid);

  const request = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`${normalizedApiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${adminToken.trim()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('管理员 token 不正确或未配置');
      }
      throw new Error(`请求失败：${response.status}`);
    }

    return response.json();
  };

  const loadUsers = async () => {
    setError('');
    setSelectedUser(null);
    setIsLoadingUsers(true);
    try {
      localStorage.setItem(API_STORAGE_KEY, normalizedApiBaseUrl);
      if (adminToken.trim()) {
        localStorage.setItem(TOKEN_STORAGE_KEY, adminToken.trim());
      }

      const result = await request<{ users: UserSummary[] }>(`/api/admin/users?date=${date}`);
      setUsers(result.users);
      const nextOpenid = selectedOpenid || result.users[0]?.openid || '';
      setSelectedOpenid(nextOpenid);
      if (nextOpenid) {
        await loadStats(nextOpenid);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载用户失败');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadStats = async (openid = selectedOpenid) => {
    if (!openid) return;
    setError('');
    setIsLoadingStats(true);
    try {
      const result = await request<{ user: UserStats }>(`/api/admin/users/${encodeURIComponent(openid)}/stats?date=${date}`);
      setSelectedUser(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载统计失败');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadEinkPreview = async () => {
    if (!selectedOpenid) return;
    setEinkError('');
    setIsLoadingEink(true);
    try {
      localStorage.setItem(EINK_DEVICE_TOKEN_STORAGE_KEY, einkDeviceToken.trim());
      const tokenResult = await request<{ userToken: string }>(`/api/admin/users/${encodeURIComponent(selectedOpenid)}/eink-token`);
      setEinkUserToken(tokenResult.userToken);

      const params = new URLSearchParams({
        openid: selectedOpenid,
        width: String(einkWidth),
        height: String(einkHeight),
        layout: einkLayout,
        page: String(einkPage),
        date,
      });
      const response = await fetch(`${normalizedApiBaseUrl}/api/eink/image.png?${params.toString()}`, {
        headers: {
          'X-Device-Token': einkDeviceToken.trim(),
          'X-User-Token': tokenResult.userToken,
        },
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? '设备 token 不正确' : `预览生成失败：${response.status}`);
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      setEinkImageUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return nextUrl;
      });
    } catch (e) {
      setEinkError(e instanceof Error ? e.message : '预览生成失败');
    } finally {
      setIsLoadingEink(false);
    }
  };

  useEffect(() => {
    if (selectedOpenid && adminToken.trim()) {
      loadStats(selectedOpenid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOpenid, date]);

  useEffect(() => () => {
    if (einkImageUrl) URL.revokeObjectURL(einkImageUrl);
  }, [einkImageUrl]);

  const totals = selectedUser?.children.reduce(
    (acc, child) => ({
      points: acc.points + child.totalPoints,
      todayTasks: acc.todayTasks + child.todayCompletedTasks,
      todayPoints: acc.todayPoints + child.todayPoints,
      redemptions: acc.redemptions + child.todayRedemptions,
    }),
    { points: 0, todayTasks: 0, todayPoints: 0, redemptions: 0 },
  );

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1F2933]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#FF6348]">StarAchiever 数据看板</p>
              <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#1F2933]">儿童打卡统计</h1>
              <p className="mt-2 text-sm text-gray-500">按微信用户快照查看孩子积分、当天任务和兑换记录。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(190px,1fr)_150px_auto] lg:min-w-[760px]">
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                API 地址
                <input
                  className="h-11 rounded-md border border-gray-200 bg-white px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                管理员 token
                <input
                  className="h-11 rounded-md border border-gray-200 bg-white px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                  type="password"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  placeholder="ADMIN_READ_TOKEN"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                日期
                <input
                  className="h-11 rounded-md border border-gray-200 bg-white px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <button
                className="h-11 rounded-md bg-[#FF6348] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoadingUsers || !adminToken.trim()}
                onClick={loadUsers}
              >
                {isLoadingUsers ? '加载中' : '刷新'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">用户</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{users.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {users.length === 0 && (
                <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">输入管理员 token 后点击刷新。</div>
              )}
              {users.map((user) => (
                <button
                  key={user.openid}
                  className={`rounded-md border p-3 text-left transition ${selectedOpenid === user.openid ? 'border-[#FF6348] bg-[#FFF0EC]' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                  onClick={() => setSelectedOpenid(user.openid)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{maskOpenid(user.openid)}</span>
                    <span className="text-xs text-gray-500">{user.childrenCount} 个孩子</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.children.map((child) => (
                      <span key={child.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                        {child.avatar || '👶'} {child.name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">同步：{formatTime(user.serverUpdatedAt)}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex flex-col gap-5">
            <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold">用户统计</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedSummary ? `openid: ${selectedSummary.openid}` : '请选择一个用户'}
                  </p>
                </div>
                <button
                  className="h-10 rounded-md border border-gray-200 px-4 text-sm font-bold text-gray-700 disabled:opacity-50"
                  disabled={!selectedOpenid || isLoadingStats}
                  onClick={() => loadStats()}
                >
                  {isLoadingStats ? '刷新中' : '刷新当前用户'}
                </button>
              </div>

              {totals && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-bold text-red-700">当前总积分</p>
                    <p className="mt-2 text-4xl font-black text-red-600">{totals.points}</p>
                  </div>
                  <div className="rounded-md bg-[#EEF7FF] p-4">
                    <p className="text-xs font-semibold text-gray-500">当天完成任务</p>
                    <p className="mt-2 text-2xl font-bold text-[#2563EB]">{totals.todayTasks}</p>
                  </div>
                  <div className="rounded-md bg-[#F0FDF4] p-4">
                    <p className="text-xs font-semibold text-gray-500">当天积分变化</p>
                    <p className="mt-2 text-2xl font-bold text-[#16A34A]">{formatPoints(totals.todayPoints)}</p>
                  </div>
                  <div className="rounded-md bg-[#FFF8E6] p-4">
                    <p className="text-xs font-semibold text-gray-500">当天兑换次数</p>
                    <p className="mt-2 text-2xl font-bold text-[#B7791F]">{totals.redemptions}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-bold">墨水屏预览</h2>
                  <p className="mt-1 text-sm text-gray-500">生成 ESP32 可请求的三色图片预览，支持自定义分辨率。</p>
                </div>
                <button
                  className="h-10 rounded-md bg-[#1F2933] px-4 text-sm font-bold text-white disabled:opacity-50"
                  disabled={!selectedOpenid || !adminToken.trim() || !einkDeviceToken.trim() || isLoadingEink}
                  onClick={loadEinkPreview}
                >
                  {isLoadingEink ? '生成中' : '生成预览'}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_140px_140px_120px]">
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                  设备 token
                  <input
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                    type="password"
                    value={einkDeviceToken}
                    onChange={(event) => setEinkDeviceToken(event.target.value)}
                    placeholder="EINK_DEVICE_TOKEN"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                  分辨率
                  <select
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                    value={`${einkWidth}x${einkHeight}`}
                    onChange={(event) => {
                      const [width, height] = event.target.value.split('x').map(Number);
                      setEinkWidth(width);
                      setEinkHeight(height);
                    }}
                  >
                    <option value="792x272">792 x 272</option>
                    <option value="800x480">800 x 480</option>
                    <option value="400x300">400 x 300</option>
                    <option value="296x128">296 x 128</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                  宽
                  <input
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                    type="number"
                    min={200}
                    max={1600}
                    value={einkWidth}
                    onChange={(event) => setEinkWidth(Number(event.target.value))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                  高
                  <input
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                    type="number"
                    min={100}
                    max={1200}
                    value={einkHeight}
                    onChange={(event) => setEinkHeight(Number(event.target.value))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
                  页
                  <input
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#FF6348]"
                    type="number"
                    min={0}
                    value={einkPage}
                    onChange={(event) => setEinkPage(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(['auto', 'split', 'single'] as const).map((layout) => (
                  <button
                    key={layout}
                    className={`rounded-md border px-3 py-2 text-sm font-bold ${einkLayout === layout ? 'border-[#FF6348] bg-[#FFF0EC] text-[#FF6348]' : 'border-gray-200 text-gray-600'}`}
                    onClick={() => setEinkLayout(layout)}
                  >
                    {layout === 'auto' ? '自动布局' : layout === 'split' ? '双人并排' : '单人分页'}
                  </button>
                ))}
              </div>

              {einkError && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{einkError}</div>}

              {einkImageUrl && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-auto rounded-md border border-gray-200 bg-gray-100 p-3">
                    <img className="max-w-none bg-white" src={einkImageUrl} width={einkWidth} height={einkHeight} alt="墨水屏预览" />
                  </div>
                  <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                    <p className="font-bold text-gray-800">设备请求</p>
                    <p className="mt-2 break-all">GET /api/eink/image.png?openid={selectedOpenid}&width={einkWidth}&height={einkHeight}&layout={einkLayout}&page={einkPage}&date={date}</p>
                    <p className="mt-2">Header: X-Device-Token</p>
                    <p>Header: X-User-Token</p>
                    {einkUserToken && <p className="mt-2 break-all">userToken: {einkUserToken}</p>}
                  </div>
                </div>
              )}
            </section>

            {selectedUser?.children.map((child) => (
              <section key={child.id} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-2xl">{child.avatar || '👶'}</div>
                    <div>
                      <h3 className="text-lg font-bold">{child.name}</h3>
                      <p className="text-sm text-gray-500">最后登录：{child.lastLoginDate || '暂无'} · 连续 {child.currentStreak} 天</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    当前积分 <span className="ml-1 text-2xl font-black text-red-600">{child.totalPoints}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">当天完成</p>
                    <p className="mt-1 text-xl font-bold">{child.todayCompletedTasks}/{child.totalTasks}</p>
                  </div>
                  <div className="rounded-md border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">当天积分变化</p>
                    <p className="mt-1 text-xl font-bold">{formatPoints(child.todayPoints)}</p>
                  </div>
                  <div className="rounded-md border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">累计完成任务</p>
                    <p className="mt-1 text-xl font-bold">{child.totalTasksCompleted}</p>
                  </div>
                  <div className="rounded-md border border-gray-100 p-3">
                    <p className="text-xs text-gray-500">累计获得积分</p>
                    <p className="mt-1 text-xl font-bold">{child.totalPointsEarned}</p>
                  </div>
                </div>

                <RecentTasksChart days={child.recentDays || []} />

                <DailyTaskGroups child={child} />
                {child.detailSource === 'summaryOnly' && (
                  <p className="mt-2 text-xs text-gray-500">该日期只有汇总数据，没有任务明细；新版小程序后续完成的任务会保存明细。</p>
                )}
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StatsDashboard;

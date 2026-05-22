# ESP32 墨水屏接入说明

这份文档给实现 ESP32 固件的 agent 使用。目标是让 ESP32 定时从打卡之星服务端下载一张已经渲染好的 PNG，然后显示到黑白红三色墨水屏。

## 服务地址

生产环境：

```text
https://stars.followllm.online
```

健康检查：

```text
GET https://stars.followllm.online/api/health
```

## 接口

ESP32 主要使用图片接口：

```text
GET /api/eink/image.png
```

完整示例：

```text
https://stars.followllm.online/api/eink/image.png?openid=<OPENID>&width=400&height=300&layout=split&page=0
```

请求头：

```text
X-Device-Token: <EINK_DEVICE_TOKEN>
X-User-Token: <EINK_USER_TOKEN>
```

返回：

```text
Content-Type: image/png
```

接口直接返回适合墨水屏展示的 PNG。服务端用 Chrome 渲染截图，页面内容和网页预览一致，不需要 ESP32 自己排版。

## 参数

- `openid`: 要展示的家庭用户 openid，必填
- `width`: 墨水屏宽度，默认 `400`
- `height`: 墨水屏高度，默认 `300`
- `layout`: `auto`、`single`、`split`
- `page`: 单页模式下显示第几个小朋友，从 `0` 开始
- `date`: 可选，格式 `YYYY-MM-DD`，默认当天

默认推荐：

- `400x300`: `layout=split`，并排展示最多两个小朋友
- 小屏幕：`layout=single`，通过 `page=0`、`page=1` 轮流刷新不同小朋友
- `792x272`: 可以继续使用 `layout=auto` 或 `layout=split`

## Token 获取方式

ESP32 需要两个 token：

- `EINK_DEVICE_TOKEN`: 设备共享 token，来自服务端 `.env`
- `EINK_USER_TOKEN`: 某个 openid 对应的用户读取 token

用户 token 由后台接口生成，不要在 ESP32 上计算：

```text
GET /api/admin/users/<OPENID>/eink-token
Authorization: Bearer <ADMIN_READ_TOKEN>
```

返回：

```json
{
  "openid": "<OPENID>",
  "userToken": "<EINK_USER_TOKEN>"
}
```

ESP32 固件里只保存：

- API base URL
- openid
- device token
- user token
- 屏幕宽高
- page/layout 配置

不要把 `ADMIN_READ_TOKEN`、`JWT_SECRET` 或 `EINK_USER_TOKEN_SECRET` 放进 ESP32。

## 固件流程

1. 连接 Wi-Fi。
2. 拼接 `/api/eink/image.png` URL。
3. 用 HTTPS GET 请求图片接口。
4. 带上 `X-Device-Token` 和 `X-User-Token` 请求头。
5. 如果返回 `200 image/png`，读取 PNG 内容。
6. 解码 PNG，把像素映射到三色墨水屏：
   - 接近白色 -> 白
   - 接近红色 -> 红
   - 其他深色 -> 黑
7. 刷新墨水屏。
8. 进入 deep sleep，下一次定时唤醒再请求。

建议刷新间隔先设为 5 到 15 分钟，避免频繁刷新墨水屏。

## 预览和调试

浏览器预览：

```text
https://stars.followllm.online/api/eink/preview.html?openid=<OPENID>&width=400&height=300&layout=split&page=0
```

状态 JSON：

```text
https://stars.followllm.online/api/eink/status?openid=<OPENID>&width=400&height=300&layout=split&page=0
```

这两个接口也需要同样的 token。浏览器调试时可以临时把 token 放在 query string：

```text
&deviceToken=<EINK_DEVICE_TOKEN>&userToken=<EINK_USER_TOKEN>
```

ESP32 固件里优先使用请求头，不建议把 token 放在 URL 日志里。

## 错误处理

- `401`: token 不对，检查 device token、user token、openid 是否匹配
- `404`: 该 openid 还没有同步数据
- `503`: 服务端 Chrome 截图不可用，稍后重试

固件遇到非 `200` 时不要清屏，保留上一次显示内容即可。

## curl 验证

```bash
curl -L \
  -H "X-Device-Token: <EINK_DEVICE_TOKEN>" \
  -H "X-User-Token: <EINK_USER_TOKEN>" \
  "https://stars.followllm.online/api/eink/image.png?openid=<OPENID>&width=400&height=300&layout=split&page=0" \
  -o eink.png
```

如果 `eink.png` 能正常打开，ESP32 只需要实现 HTTPS 下载、PNG 解码和屏幕刷新。

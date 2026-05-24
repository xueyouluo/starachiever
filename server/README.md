# StarAchiever Server

Node.js API for StarAchiever Kids mini-program cloud sync.

## Setup

```bash
cd server
npm install
cp .env.example .env
npm start
```

Requires Node.js 22.5+ because it uses the built-in `node:sqlite` module.

The service expects HTTPS in production. Put it behind Nginx/Caddy/Traefik and add the public domain to the WeChat mini-program `request合法域名` list.

Current production API base URL:

```text
https://stars.followllm.online
```

The server process listens on port `3001`; nginx terminates HTTPS and proxies `stars.followllm.online` to `http://127.0.0.1:3001`.

## Environment

- `PORT`: API port, defaults to `3001`
- `HOST`: bind host, defaults to `0.0.0.0`
- `DATABASE_PATH`: SQLite database file path
- `JWT_SECRET`: long random secret for API tokens
- `ADMIN_READ_TOKEN`: token for read-only web stats admin endpoints; defaults to `JWT_SECRET` if omitted
- `EINK_DEVICE_TOKEN`: shared read token for ESP32/e-ink devices
- `EINK_USER_TOKEN_SECRET`: secret used to derive per-user e-ink read tokens; defaults to `JWT_SECRET`
- `CHROME_EXECUTABLE_PATH`: Chrome/Chromium executable used for e-ink PNG screenshots
- `WECHAT_APP_ID`: mini-program AppID
- `WECHAT_APP_SECRET`: mini-program AppSecret
- `WECHAT_AUTH_MOCK`: set `true` only for local tests

## API

- `GET /api/health`
- `POST /api/auth/wechat` with `{ "code": "wx.login code" }`
- `GET /api/data` with `Authorization: Bearer <token>`
- `PUT /api/data` with `Authorization: Bearer <token>` and `{ "data": { "children": [], "activeChildId": null } }`
- `GET /api/admin/users?date=YYYY-MM-DD` with `Authorization: Bearer <ADMIN_READ_TOKEN>`
- `GET /api/admin/users/:openid/stats?date=YYYY-MM-DD` with `Authorization: Bearer <ADMIN_READ_TOKEN>`
- `GET /api/admin/users/:openid/eink-token` with `Authorization: Bearer <ADMIN_READ_TOKEN>`
- `GET /api/eink/status?openid=<openid>&panel=epd-4in2-bwr&layout=split&page=0` with `X-Device-Token` and `X-User-Token`
- `GET /api/eink/image.png?openid=<openid>&panel=gdem075f52&layout=split&page=0` with `X-Device-Token` and `X-User-Token`
- `GET /api/eink/preview.html?openid=<openid>&panel=gdem075f52&layout=split&page=0` with `X-Device-Token` and `X-User-Token`

The e-ink image endpoint renders HTML through Chrome, quantizes it to the selected panel palette, and returns PNG, so the stats-page preview and device image share the same pixels. Omitting `panel` remains compatible with existing 4.2 inch devices and selects `epd-4in2-bwr`.

| `panel` | Default size | Palette |
| --- | --- | --- |
| `epd-4in2-bwr` | `400x300` | `#000000`, `#FFFFFF`, `#FF0000` |
| `gdem075f52` | `800x480` | `#000000`, `#FFFFFF`, `#FFFF00`, `#FF0000` |

Custom `width` and `height` still override the selected panel dimensions. `layout=auto` uses two children side-by-side on larger screens and single-child paging on smaller screens.

The mini-program uses local-first sync:

- If local data exists, it is shown immediately and uploaded in the background.
- If local data is empty, the app tries to restore the snapshot from this API.
- Data is stored as a full JSON snapshot in SQLite, keyed by WeChat `openid`.

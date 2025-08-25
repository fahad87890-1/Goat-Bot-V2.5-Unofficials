## Goat Bot V2.5 Unofficials

Goat Bot is a Messenger bot that uses a personal Facebook account. This is an unofficial distribution based on the original project by NTKhang. Use at your own risk. Do not sell the source code or claim it as your own.

- **Original project**: [Goat-Bot-V2](https://github.com/ntkhang03/Goat-Bot-V2)
- **License**: MIT

---

## English

### Overview
- **Personal-account Messenger bot** with commands and events
- **Hot-reload scripts** in `scripts/cmds` and `scripts/events` (optional)
- **SQLite / MongoDB / JSON** data storage options
- **Auto login** via credentials or using existing `account.txt` appState/cookies
- **Auto-restart and listen recovery** options
- **Notifications** on listen errors (Telegram/Gmail/Discord webhook)

### Requirements
- Node.js: 20.18.x (recommended exactly 20.18.x)
- npm: >= 18.20.x
- A Facebook account (personal) that you own
- For MongoDB option: a MongoDB URI

### Install
```bash
git clone https://github.com/ThanhLoc04/Goat-Bot-V2.5-Unofficials.git
cd Goat-Bot-V2.5-Unofficials
npm install
```

### Configure
Main config file: `config.json`

- **Language**: set `language` to `en` or `vi`
- **Prefix**: `prefix` (default: `l-`)
- **Admins**: add Facebook UIDs to `adminBot` (strings or numbers)
- **Database**: set `database.type` to `sqlite`, `mongodb`, or `json`
  - For MongoDB, set `database.uriMongodb`
- **Auto-load scripts**: `autoLoadScripts.enable` to true to watch and reload changed scripts
- **Auto restart**: configure `autoRestart.time` (ms or cron string) or set to null/false to disable
- **Whitelist**: `whiteListMode` / `whiteListModeThread` to restrict usage
- **FCA options**: in `optionsFca` (see original docs)

Facebook login options in `config.json -> facebookAccount`:
- Set `email`, `password`, and optional `2FASecret` for auto-login; or
- Provide `account.txt` with a valid appState JSON array or raw cookie string.

About `account.txt` (at project root):
- If it contains a valid appState JSON array, the bot will use it.
- If missing/invalid and you set `facebookAccount.email/password`, the bot will auto-login and write a fresh appState to `account.txt`.
- You may paste a raw cookie string (e.g., `c_user=...; xs=...; fr=...; datr=...`); the bot converts it into an appState JSON automatically.

### Run
Windows (PowerShell/CMD):
```bash
npm run start       # NODE_ENV unset
npm run dev         # NODE_ENV=development
npm run prod        # NODE_ENV=production
```

Cross-platform (direct):
```bash
node index.js
# or
NODE_ENV=development node index.js
```

When the bot logs in successfully, it will print bot info (ID, prefix, language) and start listening to Messenger events.

### Project Structure (key parts)
```
bot/
  login/               # login and runtime bootstrap
  handler/             # message/event handling pipeline
scripts/
  cmds/                # command scripts (*.js)
  events/              # event scripts (*.js)
languages/             # language resources and helpers
database/              # models and controllers for sqlite/mongodb/json
fb-chat-api/           # fb api wrapper used by the bot
utils.js               # shared utilities
config.json            # main configuration
configCommands.json    # command-level config and envs
account.txt            # appState or cookie string for login
```

### Database
- `sqlite` (default): no extra setup
- `mongodb`: set `database.type` to `mongodb` and fill `database.uriMongodb`
- `json`: not recommended for production

Optional behaviors:
- `database.autoSyncWhenStart`: sync DB entities at startup
- `database.autoRefreshThreadInfoFirstTime`: refresh thread info on first message after start

### Commands and Events
- Place command files in `scripts/cmds/*.js`
- Place event files in `scripts/events/*.js`
- If `autoLoadScripts.enable` is true, edits are reloaded automatically (files ending with `.eg.js` are ignored)

### Notifications on Listen Errors
Configure `notiWhenListenMqttError` for:
- **Telegram**: set `botToken` and `chatId`, enable the section
- **Gmail**: set `gmail.enable` and credentials (uses `gmailAccount` from config) - *has remove*
- **Discord**: set `discordHook.webhookUrl` and enable

### Troubleshooting
- "Invalid JSON in config…": fix `config.json` or `configCommands.json` formatting
- Node version mismatch: use Node 20.18.x
- Login fails: ensure valid `account.txt` appState/cookie or correct email/password/2FASecret
- Language not applied: make sure `config.json.language` is `en` or `vi`
- MongoDB not connecting: verify `database.uriMongodb`

### Security Note
Using personal Facebook accounts for automation can violate platform rules and may lead to restrictions. Proceed only if you understand the risks.

### Credits
- Created by NTKhang. This repo is an unofficial distribution of their work.

---

## Tiếng Việt

### Tổng quan
- **Bot Messenger dùng tài khoản cá nhân** với hệ thống lệnh và sự kiện
- **Tự động tải lại script** trong `scripts/cmds` và `scripts/events` (tùy chọn)
- **Lưu trữ dữ liệu**: SQLite / MongoDB / JSON
- **Đăng nhập tự động** bằng tài khoản trong `config.json` hoặc `account.txt`
- **Tự khởi động lại** và khôi phục lắng nghe sự kiện
- **Gửi thông báo** khi lỗi lắng nghe (Telegram/Gmail/Discord webhook)

### Yêu cầu
- Node.js: 20.18.x (khuyến nghị đúng 20.18.x)
- npm: >= 16
- Một tài khoản Facebook cá nhân thuộc sở hữu của bạn
- Dùng MongoDB: cần URI kết nối MongoDB

### Cài đặt
```bash
git clone https://github.com/ThanhLoc04/Goat-Bot-V2.5-Unofficials.git
cd Goat-Bot-V2.5-Unofficials
npm install
```

### Cấu hình
File cấu hình chính: `config.json`

- **Ngôn ngữ**: `language` là `en` hoặc `vi`
- **Tiền tố lệnh**: `prefix` (mặc định: `l-`)
- **Quản trị viên**: thêm UID Facebook vào `adminBot`
- **Cơ sở dữ liệu**: `database.type` là `sqlite`, `mongodb` hoặc `json`
  - Nếu dùng MongoDB, điền `database.uriMongodb`
- **Tự tải lại script**: đặt `autoLoadScripts.enable` thành true
- **Tự khởi động lại**: cấu hình `autoRestart.time` (ms hoặc cron) hoặc để null/false để tắt
- **Danh sách trắng**: bật `whiteListMode` / `whiteListModeThread` để giới hạn người dùng/nhóm
- **Tùy chọn FCA**: trong `optionsFca`

Đăng nhập Facebook (trong `config.json -> facebookAccount`):
- Điền `email`, `password`, và tùy chọn `2FASecret` để auto-login; hoặc
- Cung cấp `account.txt` chứa appState JSON hợp lệ hoặc chuỗi cookie thô.

Về `account.txt` (ở thư mục gốc):
- Nếu là appState JSON hợp lệ, bot sẽ dùng trực tiếp.
- Nếu thiếu/không hợp lệ và bạn cung cấp `email/password`, bot sẽ tự đăng nhập và ghi appState mới vào `account.txt`.
- Có thể dán chuỗi cookie dạng `c_user=...; xs=...; fr=...; datr=...`; bot sẽ tự chuyển thành appState JSON.

### Chạy bot
Windows (PowerShell/CMD):
```bash
npm run start       # NODE_ENV không đặt
npm run dev         # NODE_ENV=development
npm run prod        # NODE_ENV=production
```

Đa nền tảng (chạy trực tiếp):
```bash
node index.js
# hoặc
NODE_ENV=development node index.js
```

Sau khi đăng nhập thành công, bot sẽ in thông tin bot (ID, prefix, ngôn ngữ) và bắt đầu lắng nghe sự kiện Messenger.

### Cấu trúc dự án (chính)
```
bot/
  login/               # đăng nhập và khởi động
  handler/             # pipeline xử lý tin nhắn/sự kiện
scripts/
  cmds/                # lệnh (*.js)
  events/              # sự kiện (*.js)
languages/             # tài nguyên ngôn ngữ
database/              # models và controllers cho sqlite/mongodb/json
fb-chat-api/           # thư viện fb api được bot sử dụng
utils.js               # tiện ích dùng chung
config.json            # cấu hình chính
configCommands.json    # cấu hình/biến môi trường cho lệnh
account.txt            # appState hoặc cookie để đăng nhập
```

### Cơ sở dữ liệu
- `sqlite` (mặc định): không cần cấu hình thêm
- `mongodb`: đặt `database.type` = `mongodb` và điền `database.uriMongodb`
- `json`: không khuyến nghị cho sản xuất

Tùy chọn:
- `database.autoSyncWhenStart`: đồng bộ dữ liệu khi khởi động
- `database.autoRefreshThreadInfoFirstTime`: làm mới thông tin thread khi nhận tin nhắn đầu tiên

### Lệnh và Sự kiện
- Thêm lệnh ở `scripts/cmds/*.js`
- Thêm sự kiện ở `scripts/events/*.js`
- Nếu `autoLoadScripts.enable` là true, sửa đổi sẽ được tải lại tự động (bỏ qua tệp `.eg.js`)

### Thông báo khi lỗi lắng nghe
Cấu hình `notiWhenListenMqttError`:
- **Telegram**: đặt `botToken`, `chatId` và bật
- **Gmail**: bật `gmail.enable` và cung cấp thông tin tài khoản (dùng `gmailAccount` trong config) - *đã loại bỏ*
- **Discord**: đặt `discordHook.webhookUrl` và bật

### Khắc phục sự cố
- "Invalid JSON in config…": kiểm tra định dạng `config.json` hoặc `configCommands.json`
- Sai phiên bản Node: dùng Node 20.18.x
- Đăng nhập thất bại: đảm bảo `account.txt` hợp lệ hoặc thông tin email/password/2FASecret chính xác
- Không đổi ngôn ngữ: chắc chắn `config.json.language` là `en` hoặc `vi`
- Kết nối MongoDB lỗi: kiểm tra `database.uriMongodb`

### Lưu ý bảo mật
Tự động hóa bằng tài khoản Facebook cá nhân có thể vi phạm quy định nền tảng và dẫn đến hạn chế tài khoản. Hãy cân nhắc rủi ro trước khi sử dụng.

### Ghi công
- Tác giả: NTKhang. Kho này là bản phân phối không chính thức dựa trên dự án gốc.



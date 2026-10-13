# UOBQ · 公网部署说明（Render + Netlify）

## 部署目的
首个公网测试版采用**同源部署**：Render 同时提供首页、单人页面、多人页面以及 Node.js `/api/*` 接口。多人大厅通过 SSE 同步，不需要跨域配置。已经打包 `render.yaml`。

## A. 部署 Render
1. 连接 Render 应用并授权你的账号，或者登录 https://dashboard.render.com/ 。
2. 将这个 `UOBQ-Multiplayer` 文件夹放到一个 GitHub 仓库根目录（注意包括 `server/`、`public/`、`package.json`、`render.yaml`）。
3. Render 选择 **New > Blueprint**，连接 GitHub 仓库，然后创建 Web Service；或者手动创建 Web Service，设置：
   - Runtime: Node
   - Build Command: `npm test`
   - Start Command: `npm start`
   - Health Check Path: `/healthz`
   - Root Directory: 仓库根目录（如实际在子目录，需要指定子目录）
4. 等 Render 显示 **Live**，打开平台实际提供的 `https://...onrender.com/` 地址；请勿自行猜测 URL。
5. 访问 `/healthz`，确认返回 `{ "ok": true, "service": "uobq-multiplayer" }`。
6. 进入 `/multiplayer.html`，用电脑与手机分别访问同一个 Render 地址，用房间码完成两人联机。

## B. 与原 Netlify 网站连接
最简单方法：将原 Netlify 首页的多人联机入口（`index.html` 的 `a[href="multiplayer.html"]`）改为你部署出的完整 Render 网址，例如 `https://实际Render域名/multiplayer.html`。
**必须等 Render 真实 URL 创建后才能填入**。不要把 `localhost:3000` 放进 Netlify 页面，也不要将当前 `multiplayer.html` 单独上传 Netlify：其 API 相对路径会请求到 Netlify，导致创建房间失败。

替代做法：直接把 Render 公网首页作为新的游戏正式入口；旧 Netlify 保留作品集/展示入口。

## C. 必须注意
- 当前为双人测试版、没有数据库，服务重启会清空房间与累计积分。
- 免费服务可能有闲置休眠、唤醒时间及套餐限制，依据部署时 Render 官方页面为准；房间状态在进程内存中。
- 房间码不是秘密，真正权限由每个玩家独立 token 控制；不要公开带有 token 的完整网址。
- 双浏览器（建议独立浏览器/无痕窗口）模拟两名玩家，测试开局、记牌、抽牌、技能、断线重连及 CABO 结算。
- 测试版尚不适合公开给大量未知用户，正式运营前需增加限流、历史持久化、安全验证和断线处理。

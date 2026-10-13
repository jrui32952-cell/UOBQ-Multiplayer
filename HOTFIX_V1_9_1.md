# UOBQ V1.9.1 — 开局冻结修复

## 原因
`game.js` 中 `render()` 使用 `E.aiBadge` 和 `E.playerBadge`，但 DOM 元素映射 `E` 里未定义这两项。`setup()` 调用 `render()` 时会抛出 TypeError，从而没有执行 `startCountdown()`。因此页面一直显示“准备开局……”，虽然牌面已显示但无法交互。

## 修复
- 将 `aiBadge`、`playerBadge` 两个 DOM 引用加入 `E`。
- 删除一次重复的动作锁检查。
- 检查 `E` 所有 JS 引用均存在，映射的所有 ID 均能在 `game.html` 找到。
- `node --check game.js` 通过。

## 验收状态
已完成静态代码验证；此环境中的 Chromium 被管理员阻止访问本地 / 虚拟 URL，不能宣称浏览器实机对局通过。

## 重新部署
将 ZIP 解压后，上传其中 `uobq-home` 文件夹里的网页内容（确保 `game.js` 覆盖旧文件）。Netlify 发布成功后强制刷新页面（Windows: Ctrl+Shift+R）。预计开局应显示 3→2→1→GO，之后点击自己的两张暗牌开始游戏。

# 旅游规划助手 — Web 版

> 自驾行程规划展示应用，可一键部署到 Cloudflare Pages。

## 预览

- 行程总览：总路线地图（按天分色）+ 每日概要卡片
- 每日详情：当日路线地图 + 时间轴 + 景点攻略 + 费用估算

## 本地预览

```bash
# 方式一：Python
cd /Users/zoucl/Downloads/旅游规划助手_配置包_脱敏版_20260213
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二：Node.js
npx -y serve .
```

## 部署到 Cloudflare Pages

### 方式一：直接上传（最简单）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 给项目起个名字（如 `trip-planner`）
4. 将项目文件夹中的以下文件/目录拖进上传区：
   - `index.html`
   - `css/` 目录
   - `js/` 目录
5. 点击 **Deploy**
6. 部署完成后会获得 `https://trip-planner.pages.dev` 域名

### 方式二：Git 仓库连接

1. 将项目推送到 GitHub/GitLab 仓库
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Connect to Git**
3. 选择仓库，构建设置：
   - **Framework preset**: None
   - **Build command**: 留空
   - **Build output directory**: `.` 或 `/`
4. 部署后每次 push 自动更新

### 方式三：Wrangler CLI

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
wrangler pages deploy . --project-name=trip-planner
```

## 配置高德地图

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 创建应用 → 添加 Key → 服务平台选择 **Web端(JS API)**
3. 编辑 `index.html`，取消注释 AMap script 标签，替换 `YOUR_AMAP_KEY`：

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=你的Key"></script>
```

> 没有高德 Key 也能正常使用，地图区域会显示友好的占位提示。

## 自定义行程数据

编辑 `js/data.js`，修改 `TRIP_DATA` 对象即可。数据结构参考文件内注释。

## 技术栈

- HTML5 / CSS3 / Vanilla JavaScript
- 高德地图 JS API v2.0（可选）
- Cloudflare Pages（静态托管）

## 文件结构

```
├── index.html          # 入口页面
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── data.js         # 行程数据
│   ├── map.js          # 地图模块
│   └── app.js          # 核心逻辑
├── README.md           # 本文件
├── docs/               # 原配置包文档
├── env/                # 环境变量模板
└── templates/          # 配置模板
```

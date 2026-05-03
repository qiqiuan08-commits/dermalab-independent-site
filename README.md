# DermaLab Institute 高端医美学术实验室风格独立站

这是一个面向中国市场的双语高端功效护肤独立站原型，视觉方向为“医美学术实验室”。页面强调专业护理项目、肤况评估、学术证据、产品对比和预约咨询。

## 预览

推荐通过本地后端服务打开，这样后台配置和线索保存才会生效：

```text
node server.js
```

前台地址：

```text
http://127.0.0.1:4173
```

后台地址：

```text
http://127.0.0.1:4173/admin
```

后台演示 PIN：

```text
admin123
```

## 已包含模块

- 高端实验室风格首屏
- 双语切换
- 护理项目矩阵
- 互动肤况评估
- 学术证据体系占位
- 四步护理流程
- 产品套组对比表
- 会员复购、顾问背书、报告下载模块
- 资料下载中心占位
- 微信客服弹窗占位
- 移动端菜单
- 浮动咨询 CTA
- FAQ
- 预约/经销/机构合作表单，含基础必填校验
- 本地 Node.js 后端
- 后台控制系统
- 首页内容配置
- 资料链接配置
- 微信入口配置
- 预约线索保存到 `data/leads.json`

## 文件

- `index.html`：页面结构
- `styles.css`：实验室风格响应式样式
- `script.js`：中英文切换、肤况评估互动和表单反馈
- `server.js`：本地后端服务和 API
- `admin.html` / `admin.css` / `admin.js`：后台控制系统
- `data/site-content.json`：后台可编辑的网站配置
- `data/leads.json`：前台预约表单提交后的线索数据
- `assets/lab-hero.png`：实验室风格首屏图
- `assets/cosmetics-hero.png`：上一版自然美妆首屏图，保留备用

## 上线前建议

1. 替换真实品牌名、产品图、产品名称和价格。
2. 接入微信二维码、小程序商城、支付、会员系统和数据统计。
3. 上传真实检测报告、备案信息、产品标签和合规说明。
4. 医美相关表达保持边界：说明为日常护肤建议，不替代医生诊疗。

## 发布到 Render

这个项目已经包含 `package.json` 和 `render.yaml`，可以作为 Node Web Service 发布。

1. 把当前项目上传到 GitHub 仓库。
2. 打开 Render，选择 New Web Service。
3. 连接该 GitHub 仓库。
4. Build Command 使用：

```text
npm run check
```

5. Start Command 使用：

```text
npm start
```

6. 添加环境变量：

```text
ADMIN_PIN=换成你自己的后台密码
```

7. 部署完成后，前台为 Render 分配的域名，后台为：

```text
https://你的域名/admin
```

注意：当前 `data/leads.json` 是文件型存储，适合演示和早期测试。正式线上长期使用建议换成数据库，例如 Supabase、PostgreSQL、MongoDB 或飞书/企微表格。

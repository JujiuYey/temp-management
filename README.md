# 医院综合管理平台（演示）

React 18 + TypeScript + Vite + Ant Design 搭建的医院综合管理平台前端原型，包含考试、考勤、医务、协同、行政等子系统，数据均为前端 Mock。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5180
```

## 构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建结果
```

构建时 `base` 为 `/temp-management/`（对应 GitHub Pages 项目地址），开发时为 `/`，见 `vite.config.ts`。

## 部署

线上地址：https://jujiuyey.github.io/temp-management/

```bash
npm run deploy:pages
```

该命令会构建并把 `dist/` 强制推送到 `gh-pages` 分支，GitHub Pages 约 1 分钟内自动更新。脚本会尝试推送到所有已配置的 remote（`origin`、`github`），某个失败不影响其他站点。

> 注意：Gitee Pages 服务已于 2024 年下线，无法再用于静态站点托管。

## 目录结构

```
src/
  components/
    layout/        顶部导航、侧边菜单、应用切换
    exam/          考试系统
    attendance/    考勤系统
    medical/       医务系统
    coop/          协同系统
    admin/         行政系统
    technology/    技术/监控类页面
    permission/    权限分析
  config/          应用清单、主题、布局常量
docs/              产品设计文档
scripts/           deploy-pages.sh 部署脚本
```

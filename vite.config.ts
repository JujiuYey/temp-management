import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  // 项目 Pages 地址为 https://hu_jiancheng.gitee.io/management/，
  // 打包时资源需带上 /management/ 前缀，开发时仍用根路径。
  base: command === 'build' ? '/management/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5180,
    open: true,
  },
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages 地址为 https://jujiuyey.github.io/temp-management/，
  // 打包和本地预览时资源需带上 /temp-management/ 前缀，开发时仍用根路径。
  base: command === 'build' || isPreview ? '/temp-management/' : '/',
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

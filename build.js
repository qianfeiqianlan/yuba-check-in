#!/usr/bin/env node
/**
 * 跨平台打包脚本，自动识别系统环境，无需区分win/mac/linux
 * 只需运行 node build.js 即可在所有平台打包
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const outputFile = 'yuba-check-in.zip'
const excludePatterns = [
  'node_modules',
  '.git',
  '.gitignore',
  '*.md',
  'LICENSE',
  'build.js',
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json'
]

console.log('🔨 开始打包插件...')

// 先清理旧的打包文件
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile)
  console.log('🧹 已清理旧的打包文件')
}

try {
  // 手动收集需要打包的文件，更准确兼容所有平台
  const allowedFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'content.js',
    'content.css',
    'background.js',
    'js',
    'icons'
  ]

  if (process.platform === 'win32') {
    // Windows 平台使用 PowerShell 打包，明确指定包含的文件
    const includeStr = allowedFiles.map(f => `'${f}'`).join(',')
    execSync(`powershell Compress-Archive -Path ${includeStr} -DestinationPath ${outputFile} -Force`, {
      stdio: 'inherit'
    })
  } else {
    // Linux/Mac 平台使用 zip 命令，明确指定包含的文件
    const includeStr = allowedFiles.join(' ')
    execSync(`zip -r ${outputFile} ${includeStr}`, {
      stdio: 'inherit'
    })
  }

  const stats = fs.statSync(outputFile)
  const size = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`✅ 打包完成！文件大小: ${size} MB`)
  console.log(`📦 输出文件: ${path.resolve(outputFile)}`)
} catch (error) {
  console.error('❌ 打包失败:', error.message)
  process.exit(1)
}

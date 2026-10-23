/** 非交互本地构建，不触发 CLI 的版本递增或发布流程。 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const platform = process.argv[2] || 'ios'
if (!['ios', 'android'].includes(platform)) throw new Error('Expected ios or android')
const cli = require.resolve('@react-native-community/cli/build/bin.js')
const projectRoot = path.resolve(__dirname, '..')
const bundlePath = path.join(projectRoot, 'dist', platform, 'index.bundle')
fs.rmSync(bundlePath, { force: true })
const result = spawnSync(process.execPath, [cli, 'bundle', '--platform', platform, '--dev', 'false', '--entry-file', 'index.js', '--bundle-output', bundlePath, '--assets-dest', `dist/${platform}`, '--reset-cache'], { cwd: projectRoot, stdio: 'inherit', env: { ...process.env, TARO_ENV: 'htyf', NODE_ENV: 'production' } })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
if (!fs.existsSync(bundlePath) || fs.statSync(bundlePath).size === 0) {
  console.error(`HTYF ${platform} bundle 缺失或为空，编译未成功: ${bundlePath}`)
  process.exit(1)
}

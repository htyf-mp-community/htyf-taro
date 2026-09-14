import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import inquirer from 'inquirer'

import { chalk } from '@tarojs/helper'
import * as child_process from 'child_process'

import { printDevelopmentTip } from './util'
import { syncDepsShell } from './sync-deps'

import type { IPluginContext } from '@tarojs/service'
import { getAppExposesOptions, mpBuildShell } from './htyf-build'

function checkReactNativeDependencies (packageInfo: any): boolean {
  const packageNames = ['react', 'react-native', '@htyf-mp/taro-rn', '@htyf-mp/taro-rn-runner']
  const { dependencies, devDependencies } = packageInfo
  for (let i = 0; i < packageNames.length; i++) {
    if (!dependencies[packageNames[i]] && !devDependencies[packageNames[i]]) {
      return false
    }
  }
  return true
}

function checkWebpackConfig (workspaceRoot: string): boolean {
  const  exists = fs.existsSync(path.join(workspaceRoot, 'webpack.config.mjs'))
  if (!exists) {
    fs.copyFileSync(path.join(__dirname, '../webpack.config.mjs'), path.join(workspaceRoot, 'webpack.config.mjs'))
    return false
  } 
  return true
}

function checkHtyfConfig (workspaceRoot: string): boolean {
  const  exists = fs.existsSync(path.join(workspaceRoot, 'htyf.config.json'))
  if (!exists) {
    fs.copyFileSync(path.join(__dirname, '../htyf.config.json'), path.join(workspaceRoot, 'htyf.config.json'))
    return false
  } 
  return true
}

function bumpPatchVersion (version: string): string {
  const parts = String(version || '0.0.0').split('.')
  const lastIndex = parts.length - 1
  const last = parseInt(parts[lastIndex], 10)
  parts[lastIndex] = String(Number.isNaN(last) ? 1 : last + 1)
  return parts.join('.')
}

async function promptAndBumpAppVersion (appPath: string, inquirerFun: any): Promise<string> {
  const packageJsonPath = path.join(appPath, 'package.json')
  const packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, {
    encoding: 'utf8'
  }))
  const currentVersion = packageInfo.version || '0.0.0'
  const nextVersion = bumpPatchVersion(currentVersion)

  const { version } = await inquirerFun.prompt([
    {
      type: 'input',
      name: 'version',
      message: `当前版本为 ${currentVersion}，请确认构建版本号：`,
      default: nextVersion,
      validate: (input: string) => {
        if (!/^\d+(\.\d+)*$/.test(String(input).trim())) {
          return '请输入合法的版本号，例如 1.0.1'
        }
        return true
      }
    }
  ])

  const confirmedVersion = String(version).trim()
  packageInfo.version = confirmedVersion
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageInfo, null, 2)}\n`, 'utf8')
  console.log(chalk.green(`版本号已更新: ${currentVersion} -> ${confirmedVersion}`))
  return confirmedVersion
}

function makeSureReactNativeInstalled (workspaceRoot: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const packageInfo = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), {
      encoding: 'utf8'
    }))
    checkWebpackConfig(workspaceRoot);
    checkHtyfConfig(workspaceRoot)
    if (checkReactNativeDependencies(packageInfo)) {
      resolve()
    } else {
      // 便于开发时切换版本
      const devTag = process.env.DEVTAG || 'latest'
      console.log('Installing HTYF-MP related packages:')
      const pkg = {
        "react": "19.2.3",
        "react-18": "npm:react@18.3.1",
        "react-native": "0.86.0",
        "@react-native/metro-config": "0.86.0",
        "expo": "57.0.6",
        "@htyf-mp/taro-rn": devTag,
        "@htyf-mp/taro-components-rn": devTag,
        "@htyf-mp/taro-rn-runner": devTag,
        "@htyf-mp/taro-rn-supporter": devTag,
        "@htyf-mp/taro-runtime-rn": devTag,
      }
      let packages = Object.entries(pkg).map(([key, value]) => `${key}${value ? `@${value}` : ''}`).join(' ')
      console.log(packages)
      // windows下不加引号的话，package.json中添加的依赖不会自动带上^
      packages = packages.split(' ').map(str => `"${str}"`).join(' ')
      let installCmd = `npm install ${packages} --save`
      if (fs.existsSync(path.join(workspaceRoot, 'yarn.lock'))) {
        installCmd = `yarn add ${packages} --force`
      }
      if (fs.existsSync(path.join(workspaceRoot, 'pnpm-lock.yaml'))) {
        installCmd = `pnpm add ${packages}`
      }
      child_process.exec(installCmd, error => {
        if (error) {
          reject(error)
          return
        }
        console.log(chalk.green(`HTYF-MP related packages have been installed successfully.${os.EOL}${os.EOL}`))
        console.log(`${chalk.yellow('ATTEHNTION')}: Package.json has been modified automatically, please submit it by yourself.${os.EOL}${os.EOL}`)
        resolve()
      })
    }
  })
}

export default (ctx: IPluginContext) => {
  ctx.registerPlatform({
    name: 'htyf',
    useConfigName: 'htyf',
    async fn ({ config }) {
      const { appPath, nodeModulesPath } = ctx.paths
      const { npm } = ctx.helper
      const {
        deviceType = 'ios',
        port,
        resetCache,
        publicPath,
        bundleOutput,
        sourcemapOutput,
        sourceMapUrl,
        sourcemapSourcesRoot,
        assetsDest,
        qr
      } = ctx.runOpts.options

      printDevelopmentTip('htyf', appPath)

      // 准备 rnRunner 参数
      const rnRunnerOpts = {
        ...config,
        nodeModulesPath,
        deviceType,
        port,
        qr,
        resetCache,
        publicPath,
        bundleOutput,
        sourcemapOutput,
        sourceMapUrl,
        sourcemapSourcesRoot,
        assetsDest,
        buildAdapter: config.platform,
      }

      if (!rnRunnerOpts.entry) {
        rnRunnerOpts.entry = 'app'
      }

      /**
       * 用inquirer 添加一些额外的命令 
       * [ACTION_TYPES.MP_DEV]: 'htyf小程序本地开发',
       * [ACTION_TYPES.MP_BUILD]: 'htyf小程序打包',
       * [ACTION_TYPES.MP_DEBUG]: 'htyf小程序真机调试',
       * [ACTION_TYPES.SYNC_DEPS]: 'htyf同步依赖版本',
       * [ACTION_TYPES.QUIT]: '退出',
       *  */ 
      const ACTION_TYPES = {
        MP_DEV: 'mp_dev',
        MP_BUILD: 'mp_build',
        MP_DEBUG: 'mp_debug',
        SYNC_DEPS: 'sync_deps',
        QUIT: 'quit',
      }
      // @ts-ignore
      const inquirerFun = typeof inquirer?.prompt === 'function' ? inquirer : inquirer.default;
      const nativeBuild = process.env.HTYF_BUILD_MODE === 'native'
      const result = nativeBuild ? { index: ACTION_TYPES.MP_BUILD } : await inquirerFun
      // @ts-ignore
      .prompt([
        {
          type: 'rawlist',
          name: 'index',
          message: '请选择你想要执行的操作：',
          choices: [
            { name: '红糖小程序 - 本地开发', value: ACTION_TYPES.MP_DEV },
            { name: '红糖小程序 - 真机调试', value: ACTION_TYPES.MP_DEBUG },
            { name: '红糖小程序 - 打包小程序', value: ACTION_TYPES.MP_BUILD },
            { name: '同步依赖版本', value: ACTION_TYPES.SYNC_DEPS },
            { name: '👋 退出', value: ACTION_TYPES.QUIT },
          ],
        },
      ])

      // 默认不开启watch
      rnRunnerOpts.isWatch = false;

      if (result.index === ACTION_TYPES.QUIT) {
        process.exit(0)
      }

      if (result.index === ACTION_TYPES.SYNC_DEPS) {
        console.log('sync_deps')
        await syncDepsShell(appPath)
        return
      }

      if (result.index === ACTION_TYPES.MP_DEV) {
        console.log('mp_dev')
        rnRunnerOpts.isWatch = true;
      }

      if (!nativeBuild && (result.index === ACTION_TYPES.MP_DEBUG || result.index === ACTION_TYPES.MP_BUILD)) {
        // 要打生产包让 env 为 production; 让react使用production模式
        process.env.NODE_ENV = 'production'
        await promptAndBumpAppVersion(appPath, inquirerFun)
      }
      if (nativeBuild) process.env.NODE_ENV = 'production'
      console.log(JSON.stringify(rnRunnerOpts, null, 2))

      try {
        if (nativeBuild) {
          const packageInfo = JSON.parse(fs.readFileSync(path.join(appPath, 'package.json'), 'utf8'))
          if (!checkReactNativeDependencies(packageInfo)) {
            throw new Error('原生构建需要先安装 React Native 和 HTYF 依赖')
          }
        } else {
          await makeSureReactNativeInstalled(appPath)
        }
        // build with metro
        const rnRunner = await npm.getNpmPkg('@htyf-mp/taro-rn-runner', appPath)
        process.env.APP_EXPOSES_OPTIONS = '';
        process.env.APP_ROOT_INDEX_PATH = '';
        if (result.index !== ACTION_TYPES.MP_DEV && !nativeBuild) {
          process.env.APP_EXPOSES_OPTIONS = JSON.stringify((await getAppExposesOptions(appPath)).APP_EXPOSES_OPTIONS);
          process.env.APP_ROOT_INDEX_PATH = (await getAppExposesOptions(appPath)).APP_ROOT_INDEX_PATH;
        }
        
        await rnRunner(appPath, rnRunnerOpts, () => {})
        if (nativeBuild) {
          const bundlePath = rnRunnerOpts.bundleOutput || path.join(appPath, config.outputRoot || 'dist', 'index.bundle')
          if (!fs.existsSync(bundlePath) || fs.statSync(bundlePath).size === 0) {
            throw new Error(`HTYF 原生 JS bundle 缺失或为空: ${bundlePath}`)
          }
          return
        }
        if (result.index === ACTION_TYPES.MP_DEBUG || result.index === ACTION_TYPES.MP_BUILD) {
          const zipPath = await mpBuildShell(appPath, result.index === ACTION_TYPES.MP_DEBUG ? 'debug' : 'build')
          if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
            throw new Error(`HTYF 构建产物缺失或为空: ${zipPath}`)
          }
        }
      } catch (error) {
        console.error(chalk.red('HTYF 构建失败:'), error)
        throw error
      }
    }
  })
}

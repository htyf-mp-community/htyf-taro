# HTYF Taro

Taro 的红糖云服构建目标、React Native 运行时与组件、样式转换工具，以及可运行示例。

本仓库从 htyf-cli 拆分，保留现有 `@htyf-mp/*` 包名和版本。CLI 通过已发布的 `@htyf-mp/cli` 依赖接入，AI 迁移规则由独立的 htyf-skills 仓库维护。

## 使用模板

先确认安装的 CLI `--help` 包含 `init` 子命令，再执行：

```sh
npx --yes @htyf-mp/cli --help
npx --yes @htyf-mp/cli init --non-interactive --name my-taro-app --display-name 我的应用 --template taro
cd my-taro-app
npm install
npm run dev:htyf
```

`dev:htyf` 和 `build:htyf` 当前都会进入平台菜单，再选择本地开发、真机调试或打包。打包读取 `htyf.config.json` 的应用标识与资源地址、`package.json` 的版本，输出到 `dist_htyf/`；请先核对模板配置。

Taro 项目模板由 htyf-cli 的 `packages/cli/_taro_temp_` 维护。使用 `init` 前请确认已安装的 CLI 版本包含该模板。

## 目录

| 目录 | 职责 |
| --- | --- |
| `packages/taro-plugin-platform` | `taro build --type htyf` 平台插件 |
| `packages/taro-rn*` | API、编译、运行支持和样式转换 |
| `packages/taro-components-rn` | RN 组件实现 |
| `packages/taro-router-rn`、`packages/taro-runtime-rn` | 路由和运行时 |
| `packages/css-to-react-native`、`packages/stylelint*` | CSS 转换与样式检查 |
| `examples/taro` | 工作区示例，引用本地运行时包 |

## 开发

```sh
pnpm install
pnpm build
pnpm test:packages
pnpm verify:packages
```

示例加入 workspace，CLI 使用明确的 npm 版本。发布前运行包归档检查，并将编译器、运行时、CLI 模板依赖作为配套版本验证。`publish:packages` 会执行真实 npm 发布，仅在准备发布时运行。

HTYF 专属业务文件使用 `.htyf.*`、平台配置使用 `htyf`；底层 RN 编译器兼容选项不能机械替换。独立 App、微信与 H5 仍需要各平台的构建环境和验收。

- [平台插件说明](packages/taro-plugin-platform/README.md)
- [示例说明](examples/taro/README.md)
- [CLI](https://github.com/htyf-mp-community/htyf-cli)
- [AI 迁移技能](https://github.com/htyf-mp-community/htyf-skills)
- [拆分来源](SPLIT_ORIGIN.md)

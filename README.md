# HTYF Taro

Taro 的红糖云服构建目标、React Native 运行时与组件、样式转换工具，以及可运行模板和示例。

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

新 CLI 从本仓库 `templates/taro` 读取 Taro 模板。旧 CLI 仍指向旧仓库布局时，需要升级到包含拆分支持的版本，或使用 htyf-cli 源码入口。

## 目录

| 目录 | 职责 |
| --- | --- |
| `packages/taro-plugin-platform` | `taro build --type htyf` 平台插件 |
| `packages/taro-rn*` | API、编译、运行支持和样式转换 |
| `packages/taro-components-rn` | RN 组件实现 |
| `packages/taro-router-rn`、`packages/taro-runtime-rn` | 路由和运行时 |
| `packages/css-to-react-native`、`packages/stylelint*` | CSS 转换与样式检查 |
| `templates/taro` | 用户项目模板，按发布版本安装依赖 |
| `examples/taro` | 工作区示例，引用本地运行时包 |

## 开发

```sh
pnpm install
pnpm build
pnpm test:packages
pnpm verify:packages
```

模板不加入开发 workspace，避免把发布依赖改为本地路径。示例加入 workspace，CLI 使用明确的 npm 版本。发布前运行包归档检查，并将编译器、运行时、模板依赖作为配套版本验证。`publish:packages` 会执行真实 npm 发布，仅在准备发布时运行。

HTYF 专属业务文件使用 `.htyf.*`、平台配置使用 `htyf`；底层 RN 编译器兼容选项不能机械替换。独立 App、微信与 H5 仍需要各平台的构建环境和验收。

- [平台插件说明](packages/taro-plugin-platform/README.md)
- [示例说明](examples/taro/README.md)
- [CLI](https://github.com/htyf-mp-community/htyf-cli)
- [AI 迁移技能](https://github.com/htyf-mp-community/htyf-skills)
- [拆分来源](SPLIT_ORIGIN.md)

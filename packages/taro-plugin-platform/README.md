# `@htyf-mp/taro-plugin-platform`

Taro 插件。用于支持编译为红糖云服端小程序。

## 使用

#### 1. 配置插件

```js
// Taro 项目配置
module.exports = {
  // ...
  plugins: [
    '@htyf-mp/taro-plugin-platform'
  ]
}
```

#### 2. 编译为红糖云服端小程序

```shell
taro build --type htyf
taro build --type htyf --watch
```

#### 其它

##### 平台判断

```js
if (process.TARO_ENV === 'htyf') {
  // ...
}
```

##### API

支付宝 IOT 端小程序拓展了一些独有 API，可以通过 `Taro.iot.xxx` 来调用，例：

```js
Taro.htyf.test({})
  .then(res => console.log(res))
```


## 打包与分享二维码

选择“打包小程序”后，插件在 `dist_htyf` 中生成 `app.json`、`dist.dgz`，压缩成功后自动生成分享二维码 `qrcode.png`，并在终端显示分享链接和二维码。二维码包含本次构建的应用信息、版本和资源地址，扫码进入应用分享页。

将配置和资源包分别上传到 `appUrlConfig`、`zipUrl` 地址后，使用 [红糖云服 App](https://mp.dagouzhi.com/#download) 扫码体验。每次重新打包会更新二维码，分享前请同步更新线上资源和展示的图片。

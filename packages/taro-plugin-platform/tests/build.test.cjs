const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const QRCode = require('qrcode');
const AdmZip = require('adm-zip');

// Load the actual packaging module without running the interactive Taro entrypoint.
const sourcePath = path.resolve(__dirname, '../src/htyf-build.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const buildModule = new Module(sourcePath, module);
buildModule.filename = sourcePath;
buildModule.paths = module.paths;
buildModule._compile(compiled, sourcePath);
const { mpBuildShell } = buildModule.exports;

test('packaging generates a share QR from final config and refreshes it on rebuild', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'htyf-taro-share-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist/index.bundle'), 'test bundle');
  fs.writeFileSync(path.join(root, 'htyf.config.json'), JSON.stringify({
    name: '分享测试', appid: 'share-test', assetsHost: 'https://example.com/apps/test',
  }));
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));
  let previousQr;
  for (const version of ['1.0.0', '1.1.0']) {
    logs.length = 0;
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version }));
    const zipPath = await mpBuildShell(root, 'build');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'dist_htyf/app.json')));
    assert.equal(config.version, version);
    const shareUrl = logs.find(line => line.startsWith('分享链接: ')).slice('分享链接: '.length);
    assert.equal(new URL(shareUrl).origin, 'https://mp.dagouzhi.com');
    assert.equal(new URL(shareUrl).pathname, '/share');
    assert.deepEqual(JSON.parse(new URL(shareUrl).searchParams.get('data')), config);
    const qr = fs.readFileSync(path.join(root, 'dist_htyf/qrcode.png'));
    assert.deepEqual(qr, await QRCode.toBuffer(shareUrl, { scale: 6, margin: 4 }));
    if (previousQr) assert.notDeepEqual(qr, previousQr);
    previousQr = qr;
    assert.ok(logs.findIndex(line => line.startsWith('分享二维码已生成:')) >
      logs.findIndex(line => line.startsWith('压缩包已创建:')));
    const archive = new AdmZip(zipPath);
    assert.deepEqual(JSON.parse(archive.readAsText('app.json')), config);
    assert.equal(archive.readAsText('index.bundle'), 'test bundle');
    assert.equal(archive.getEntry('qrcode.png'), null);
  }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, '../src/sync-deps.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const syncModule = new Module(sourcePath, module);
syncModule.filename = sourcePath;
syncModule.paths = module.paths;
syncModule._compile(compiled, sourcePath);

test('dependency sync updates published versions without replacing workspace links', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'htyf-taro-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'package.json');
  fs.writeFileSync(file, JSON.stringify({
    dependencies: {
      '@htyf-mp/taro-rn': 'workspace:*',
      '@htyf-mp/taro-rn-supporter': '^0.1.0',
      'react-native-reanimated': '4.6.0',
      'react-native-worklets': '0.12.2',
    },
  }));

  await syncModule.exports.syncDepsShell(root, { skipConfirm: true });

  const dependencies = JSON.parse(fs.readFileSync(file, 'utf8')).dependencies;
  assert.equal(dependencies['@htyf-mp/taro-rn'], 'workspace:*');
  assert.equal(dependencies['@htyf-mp/taro-rn-supporter'], '0.7.5');
  assert.equal(dependencies['react-native-reanimated'], '4.7.1');
  assert.equal(dependencies['react-native-worklets'], '0.13.0');
});

#!/usr/bin/env node
/**
 * 星衍 LifeVerse · standalone 单文件打包器
 * 替代旧版 build_standalone.cjs，消除硬编码路径，使用 __dirname 自动定位
 * 用法: node scripts/build-standalone.mjs
 * 产物: 项目根目录下的 星衍LifeVerse-standalone.html（双击即可离线运行）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const CSS_FILE = path.join(ROOT, 'css', 'styles.css');
const INDEX_FILE = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, '星衍LifeVerse-standalone.html');

// 收集所有 .js 文件
const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
}
walk(JS_DIR);

function resolveSpec(spec, fromFile) {
  const dir = path.dirname(fromFile);
  return path.normalize(path.join(dir, spec)).split(path.sep).join('/');
}

// 转换单个模块源码：import → __lx_req；export 去关键字，末尾注册
function transform(code, fileKey) {
  const exported = [];
  code = code.replace(/^import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm, (m, names, spec) => {
    const key = resolveSpec(spec, fileKey);
    return 'const ' + names.trim() + ' = __lx_req(' + JSON.stringify(key) + ');';
  });
  code = code.replace(/^export\s+(async\s+)?(const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm,
    (m, asyncKw, kind, name) => { exported.push(name); return (asyncKw || '') + kind + ' ' + name; });
  code = code.replace(/^export\s+\{([^}]+)\}\s*;?/gm, (m, inner) => {
    inner.split(',').forEach(s => { const n = s.trim().split(/\s+as\s+/)[0].trim(); if (n) exported.push(n); });
    return '';
  });
  const reg = exported.length
    ? '\n' + exported.map(n => '__lx_exp[' + JSON.stringify(n) + '] = ' + n + ';').join('\n')
    : '';
  return code + reg;
}

const modWrappers = files.map(f => {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const body = transform(src, f);
  return "__mods[" + JSON.stringify(f) + "] = function(__lx_req, __lx_exp){\n" + body + "\n};";
}).join('\n');

const runtime = [
  'var __mods = {};',
  'var __cache = {};',
  'function __lx_req(key){',
  '  if (__cache[key]) return __cache[key];',
  "  var factory = __mods[key];",
  "  if (!factory) throw new Error('Missing module: ' + key);",
  '  var __lx_exp = {};',
  '  __cache[key] = __lx_exp;',
  '  factory(__lx_req, __lx_exp);',
  '  return __lx_exp;',
  '}'
].join('\n');

const bundle = "(function(){\n" + runtime + "\n" + modWrappers + "\n\n__lx_req(" + JSON.stringify('js/main.js') + ");\n})();";

// 读 CSS 与 index.html
const css = fs.readFileSync(CSS_FILE, 'utf8');
let html = fs.readFileSync(INDEX_FILE, 'utf8');

const LINK_TAG = '<link rel="stylesheet" href="css/styles.css" />';
const SCRIPT_TAG = '<script type="module" src="js/main.js"></script>';

if (html.indexOf(LINK_TAG) < 0) { console.error('未找到 CSS link 标签'); process.exit(1); }
if (html.indexOf(SCRIPT_TAG) < 0) { console.error('未找到 main.js script 标签'); process.exit(1); }

const htmlOut = html.split(LINK_TAG).join('<style>\n' + css + '\n</style>')
                    .split(SCRIPT_TAG).join('<script>\n' + bundle + '\n</script>');

fs.writeFileSync(OUT, htmlOut, 'utf8');
console.log('✓ standalone 打包完成 → ' + path.relative(ROOT, OUT));
console.log('  打包模块数: ' + files.length);
console.log('  bundle 字节: ' + Buffer.byteLength(bundle, 'utf8'));

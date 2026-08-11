// 星衍 LifeVerse · 迷你 ESM 打包器 + 单文件 standalone 生成器
// 用法: node build_standalone.cjs
// 产物: 项目根目录下的 星衍LifeVerse-standalone.html（双击即可离线运行）
// 注意: 所有 String.replace 替换串都不含 $，避免 $$ 转义陷阱；最终用字符串拼接注入，不经 replace 插值。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'D:/Users/user/Desktop/数智化资料库/人生推演/星衍LifeVerse';
const JS_DIR = path.join(ROOT, 'js');
const CSS_FILE = path.join(ROOT, 'css', 'styles.css');
const INDEX_FILE = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, '星衍LifeVerse-standalone.html');
const NODE = 'C:/Users/user/.workbuddy/binaries/node/versions/22.22.2/node.exe';

// 收集所有 .js 文件，key 形如 'js/modules/nebula.js'
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(JS_DIR);

function resolveSpec(spec, fromFile) {
  const dir = path.dirname(fromFile);
  return path.normalize(path.join(dir, spec)).split(path.sep).join('/');
}

// 转换单个模块源码：import→__lx_req；export 仅去关键字，名字统一在末尾注册
function transform(code, fileKey) {
  const exported = [];
  // import ... from '...'  ->  const ... = __lx_req('key');
  code = code.replace(/^import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm, (m, names, spec) => {
    const key = resolveSpec(spec, fileKey);
    return 'const ' + names.trim() + ' = __lx_req(' + JSON.stringify(key) + ');';
  });
  // export (async)? (const|let|var|function|class) NAME  ->  仅去 export 关键字，保留整条声明
  code = code.replace(/^export\s+(async\s+)?(const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm,
    (m, asyncKw, kind, name) => { exported.push(name); return (asyncKw || '') + kind + ' ' + name; });
  // export { a, b as c }  ->  仅收集名字
  code = code.replace(/^export\s+\{([^}]+)\}\s*;?/gm, (m, inner) => {
    inner.split(',').forEach(s => { const n = s.trim().split(/\s+as\s+/)[0].trim(); if (n) exported.push(n); });
    return '';
  });
  // 在模块体末尾统一注册导出（声明已在作用域内，安全）
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

// 语法门禁：先 node --check 打包产物，避免写坏 HTML
const BUNDLE_TMP = path.join('C:/Users/user/AppData/Local/Temp', '_lv_bundle_check.js');
fs.writeFileSync(BUNDLE_TMP, bundle, 'utf8');
try {
  execSync('"' + NODE + '" --check "' + BUNDLE_TMP + '"', { stdio: 'pipe' });
} catch (e) {
  console.error('BUNDLE SYNTAX ERROR:\n' + e.stdout + e.stderr);
  process.exit(1);
}

// 读 CSS 与 index.html
let css = fs.readFileSync(CSS_FILE, 'utf8');
let html = fs.readFileSync(INDEX_FILE, 'utf8');

const LINK_TAG = '<link rel="stylesheet" href="css/styles.css" />';
const SCRIPT_TAG = '<script type="module" src="js/main.js"></script>';
if (html.indexOf(LINK_TAG) < 0) { console.error('未找到 CSS link 标签'); process.exit(1); }
if (html.indexOf(SCRIPT_TAG) < 0) { console.error('未找到 main.js script 标签'); process.exit(1); }

const htmlOut = html.split(LINK_TAG).join('<style>\n' + css + '\n</style>')
                    .split(SCRIPT_TAG).join('<script>\n' + bundle + '\n</script>');

fs.writeFileSync(OUT, htmlOut, 'utf8');
console.log('OK → ' + OUT);
console.log('打包模块数: ' + files.length);
console.log('bundle 字节: ' + Buffer.byteLength(bundle, 'utf8'));

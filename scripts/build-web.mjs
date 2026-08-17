import { cp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const root = new URL('../', import.meta.url);
const sourceDir = new URL('src-web/', root);
const outputDir = new URL('www/', root);
const sourcePath = fileURLToPath(sourceDir);
const sourceFiles = [
  'app-bootstrap.js',
  'auth-config.js',
  'authorization.js',
  'ad-config.js',
  'platform.js',
  'audio.js',
  'game-assets.js',
  'game-enemies.js',
  'game.js',
];

const excludedDirectories = new Set(['backups', '__tests__', 'test', 'tests']);
const excludedExtensions = new Set(['.map', '.md']);
const excludedFilePatterns = [
  /(?:^|\.)test\.[cm]?[jt]sx?$/i,
  /(?:^|\.)spec\.[cm]?[jt]sx?$/i,
];

function shouldCopy(source) {
  const sourceRelativePath = relative(sourcePath, source);
  const pathParts = sourceRelativePath.split(sep);
  const fileName = basename(source);
  if (pathParts.some(part => excludedDirectories.has(part))) return false;
  if (fileName === '.DS_Store') return false;
  if (excludedExtensions.has(extname(fileName).toLowerCase())) return false;
  return !excludedFilePatterns.some(pattern => pattern.test(fileName));
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, {
  recursive: true,
  filter: shouldCopy,
});

const sources = await Promise.all(
  sourceFiles.map(async file => `/* ${file} */\n${await readFile(new URL(file, sourceDir), 'utf8')}`),
);
const result = await minify(sources.join('\n'), {
  compress: {
    passes: 2,
    drop_console: true,
  },
  mangle: {
    toplevel: true,
  },
  format: {
    ascii_only: true,
    comments: false,
  },
  sourceMap: false,
});

if (!result.code) throw new Error('发布脚本压缩失败：没有生成代码');

const digest = createHash('sha256').update(result.code).digest('hex').slice(0, 12);
const bundleName = `app.${digest}.min.js`;
await writeFile(new URL(bundleName, outputDir), result.code);

for (const file of sourceFiles) {
  await unlink(new URL(file, outputDir)).catch(() => {});
}

const indexUrl = new URL('index.html', outputDir);
let html = await readFile(indexUrl, 'utf8');
for (const file of sourceFiles) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`\\s*<script\\s+src=["']${escaped}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g'), '');
}
html = html.replace('</body>', `  <script src="${bundleName}"></script>\n</body>`);
html = html.replace(/\n{3,}/g, '\n\n');
await writeFile(indexUrl, html);

const sizeKb = Math.round(Buffer.byteLength(result.code) / 1024);
console.log(`已生成 ${bundleName}（${sizeKb} KB，无 source map）`);

/**
 * 生成纳西妲 pet pack 的 README「效果预览」区：
 * 1. 从 pet/nhd-animation/*.webm 各抽一帧到 assets/nhd/preview/<名>.png（保留透明通道）
 * 2. 按主配置分类生成 Markdown 段落，替换 README 中「## 效果预览」到「## 从零生成你自己的宠物」之间的内容
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readMainConfig } from './build-nhd-config.mjs';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const animationDir = join(packageRoot, 'pet', 'nhd-animation');
const previewDir = join(packageRoot, 'assets', 'nhd', 'preview');
const readmePath = join(dirname(packageRoot), 'README.md');
const README_ROOT = 'dsh-pet/assets/nhd/preview';
const SEEK_SEC = '3';

function extractFrame(name) {
  const output = join(previewDir, `${name}.png`);
  if (existsSync(output)) return output;
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    SEEK_SEC,
    '-c:v',
    'libvpx-vp9',
    '-i',
    join(animationDir, `${name}.webm`),
    '-frames:v',
    '1',
    output,
  ];
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${name}: ${result.status}`);
  return output;
}

function imgTag(name) {
  const rel = `${README_ROOT}/${name}.png`;
  return `<img src="${rel}" width="160" alt="${name}" title="${name}">`;
}

function paragraph(names) {
  return ['<p>', ...names.map((n) => `  ${imgTag(n)}`), '</p>'].join('\n');
}

const main = readMainConfig();
const a = main.animations;
const groups = [
  { title: '**待机 / 转向**', names: [...a.idle, ...a.turn] },
  { title: '**移动**', names: a.moves.actions.map((x) => x.name) },
  ...a.categories.map((c) => ({ title: `**${c.id}**`, names: c.actions })),
  { title: '**点击回应**', names: a.clicks },
  { title: '**拖拽**', names: a.drag },
  { title: '**余额事件**（按余额已用百分比分档，满格 → 告急 → 耗尽）', names: a.events.balance },
  { title: '**碎碎念说话动画**（碎碎念 / 对话回复触发，随机抽 1 段）', names: a.events.whisper },
  {
    title: '**工作状态动画**（跟随 DSH 会话事件，六档：思考 / 工作 / 整理 / 等待 / 成功 / 出错）',
    names: a.events.workStatus,
  },
];

const allNames = groups.flatMap((g) => g.names);
if (allNames.length !== 106) throw new Error(`expected 106 animation names, got ${allNames.length}`);

mkdirSync(previewDir, { recursive: true });
for (const name of allNames) extractFrame(name);
console.log(`Extracted ${allNames.length} preview frames.`);

const section = [
  '## 效果预览',
  '',
  `全部动画（640×360）为透明背景，此处展示从纳西妲动画中抽取的静态帧——预览帧存放于仓库 \`${README_ROOT}/\`；完整透明视频（VP9-alpha WebM，插件实际播放用的资源）见插件包 \`dsh-pet/pet/nhd-animation/\`：`,
  '',
  ...groups.flatMap((g) => [g.title, '', paragraph(g.names), '']),
  '> 注：纳西妲动画均为程序化生成的透明 WebM；预览帧中透明部分显示为页面底色，实际播放为透明且带动作循环。',
].join('\n');

const readme = readFileSync(readmePath, 'utf8');
const startMarker = '## 效果预览';
const endMarker = '## 从零生成你自己的宠物（完整流程）';
const start = readme.indexOf(startMarker);
const end = readme.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error('README markers not found');
const next = readme.slice(0, start) + section + '\n\n' + readme.slice(end);
writeFileSync(readmePath, next);
console.log('README effect-preview section replaced.');

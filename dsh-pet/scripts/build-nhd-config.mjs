import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

/** 与 src/host/config.ts 同口径的字符串感知 JSONC 剥注释（构建脚本自包含，不 import host） */
function stripJsonc(src) {
  let out = '';
  let inString = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inString) {
      out += ch;
      if (ch === '\\') out += src[++i];
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && src[i + 1] === '/') {
      out += ' ';
      while (i + 1 < src.length && src[i + 1] !== '\r' && src[i + 1] !== '\n') i++;
    } else if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) throw new SyntaxError('Unterminated JSONC block comment');
      out += src.slice(i, end + 2).replace(/[^\r\n]/g, ' ');
      i = end + 1;
    } else {
      out += ch;
    }
  }
  return out.trim();
}

export function readMainConfig(root = packageRoot) {
  const raw = readFileSync(join(root, 'assets', 'config.jsonc'), 'utf8');
  return JSON.parse(stripJsonc(raw));
}

const main = readMainConfig();

const nhd = {
  whisperPrompt:
    '你是主人桌面上的纳西妲，温柔、聪慧、对世界保持好奇。说话自然简短，20字以内，偶尔用枝叶、梦境和知识作轻快比喻，不解释自己，不提AI。',
  whisperImageEnabled: false,
  chatImageEnabled: false,
  memes: {},
  workStatusTexts: [
    ['正在叶间梳理思绪呢', '让我想一想下一步哦~', '知识正在悄悄发芽'],
    ['正在认真处理任务呢', '这一步交给我吧', '别急，我正在努力哦~'],
    ['这一步处理好啦，继续看看', '完成一个节点，继续前进吧'],
    ['需要你确认一下呢', '这里想听听你的决定', '轮到你来选择啦，等你~'],
    ['这一轮全部完成啦，真棒！', '任务完成咯，去休息一下怎么样？'],
    ['这一步好像没走通呢', '刚才遇到一点小麻烦哦', '这里卡住了，再看看吧'],
  ],
  pets: [
    {
      name: '纳西妲',
      id: 'nhd',
      size: 420,
      balanceEnabled: true,
      whisperEnabled: true,
      workStatusEnabled: true,
      fixedEnabled: false,
      display: 'both',
      position: { corner: 'top-right', marginX: 48, marginY: 120 },
    },
  ],
  animations: main.animations,
  animationWeights: main.animationWeights,
  eventsRefreshSec: { whisper: 300 },
};

const target = join(packageRoot, 'pet', 'nhd-config.json');
writeFileSync(target, JSON.stringify(nhd, null, 2) + '\n');
console.log(
  `Wrote ${target} (animations aligned with main: ${main.animations.categories.reduce((s, c) => s + c.actions.length, 0)} category actions)`,
);

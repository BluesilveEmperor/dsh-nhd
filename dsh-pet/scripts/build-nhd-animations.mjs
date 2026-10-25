import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readMainConfig } from './build-nhd-config.mjs';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(packageRoot, 'assets', 'nhd');
const outputDir = join(packageRoot, 'pet', 'nhd-animation');
/** drawtext 字体：优先系统 CJK 字体（内置软糖体在部分 ffmpeg 构建下缺 CJK 字形会回退成方框） */
const FONT_CANDIDATES = [
  process.env.NHD_FONT,
  'C:/Windows/Fonts/msyh.ttc',
  'C:/Windows/Fonts/simhei.ttf',
  '/System/Library/Fonts/PingFang.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
].filter(Boolean);
const fontPath = FONT_CANDIDATES.find((p) => existsSync(p)) ?? join(packageRoot, 'assets', 'fonts', '上首软糖体.ttf');
const fontFile = fontPath.replaceAll('\\', '/').replace(':', '\\:');

/** 动画名 → 立绘与动作配方。配方键：pose 立绘、rot 旋转表达式、y 垂直表达式。 */
const RECIPES = {
  breathe: (s) => ({ rot: `${r(0.012 * s.amp)}*sin(2*PI*t/${f(4 / s.speed)})`, y: `(oh-ih)-10+${f(3 * s.amp)}*sin(2*PI*t/${f(3 / s.speed)})` }),
  sway: (s) => ({ rot: `${r(0.025 * s.amp)}*sin(2*PI*t/${f(3.5 / s.speed)})`, y: `(oh-ih)-10+${f(2 * s.amp)}*sin(2*PI*t/${f(4 / s.speed)})` }),
  jump: (s) => ({ rot: `${r(0.02 * s.amp)}*sin(2*PI*t*${f(1.5 * s.speed)})`, y: `(oh-ih)-10-${f(18 * s.amp)}*abs(sin(PI*t*${f(s.speed)}))` }),
  swing: (s) => ({ rot: `${r(0.055 * s.amp)}*sin(2*PI*t/${f(3 / s.speed)})`, y: `(oh-ih)-18+${f(5 * s.amp)}*sin(2*PI*t/${f(3 / s.speed)})` }),
  walk: (s) => ({ rot: `${r(0.025 * s.amp)}*sin(2*PI*t*${f(2 * s.speed)})`, y: `(oh-ih)-10-${f(8 * s.amp)}*abs(sin(2*PI*t*${f(2 * s.speed)}))` }),
  munch: (s) => ({ rot: `${r(0.012 * s.amp)}*sin(2*PI*t*${f(2.5 * s.speed)})`, y: `(oh-ih)-10+${f(3 * s.amp)}*abs(sin(2*PI*t*${f(2.5 * s.speed)}))` }),
  doze: (s) => ({ rot: `${r(0.008 * s.amp)}*sin(2*PI*t/${f(6 / s.speed)})`, y: `(oh-ih)-8+${f(2 * s.amp)}*sin(2*PI*t/${f(5 / s.speed)})` }),
  shake: (s) => ({ rot: `${r(0.01 * s.amp)}*sin(2*PI*t*${f(4 * s.speed)})`, y: `(oh-ih)-10+${f(2 * s.amp)}*sin(2*PI*t*${f(4 * s.speed)})` }),
  droop: (s) => ({ rot: `${r(0.008 * s.amp)}*sin(2*PI*t/${f(5 / s.speed)})`, y: `(oh-ih)-6+${f(1.5 * s.amp)}*sin(2*PI*t/${f(5 / s.speed)})` }),
};

function r(v) { return v.toFixed(4); }
function f(v) { return v.toFixed(2); }

function seedOf(name) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.codePointAt(0)) % 997;
  return { speed: 0.9 + (hash % 5) * 0.1, amp: 0.85 + (hash % 3) * 0.15 };
}

const CLASSIFIERS = [
  [/被鼠标拖拽/, 'chibi-drag', 'swing'],
  [/东张西望/, 'chibi-idle', 'sway'],
  [/待机/, 'chibi-idle', 'breathe'],
  [/点击回应/, 'chibi-happy', 'jump'],
  [/螃蟹走路|原地漂浮踏步|原地左转奔跑/, 'chibi-idle', 'walk'],
  [/钱袋满溢/, 'chibi-happy', 'jump'],
  [/金袋叮当/, 'chibi-happy', 'sway'],
  [/钱袋如常/, 'chibi-idle', 'breathe'],
  [/数金皱眉/, 'chibi-think', 'breathe'],
  [/袋空如洗|分文不剩/, 'chibi-sad', 'droop'],
  [/思考冒泡/, 'chibi-think', 'breathe'],
  [/忙碌点按/, 'chibi-work', 'shake'],
  [/清点归档/, 'chibi-work', 'sway'],
  [/原地踱步张望/, 'chibi-idle', 'walk'],
  [/雀跃庆祝/, 'chibi-happy', 'jump'],
  [/垂头叹气冒汗/, 'chibi-sad', 'droop'],
  [/擦桌碎碎念/, 'chibi-work', 'sway'],
  [/发呆碎碎念/, 'chibi-think', 'breathe'],
  [/对屏碎碎念/, 'chibi-whisper', 'sway'],
  [/是啊，吃什么/, 'chibi-eat', 'munch'],
  [/深度思考碎碎念/, 'chibi-think', 'breathe'],
  [/打瞌睡被惊醒/, 'chibi-sleep', 'sway'],
  [/睡|小憩|打瞌睡|哈欠|沉眠/, 'chibi-sleep', 'doze'],
  [/偷吃零食被抓住|吃|涮|Token|早餐|午餐|晚餐|零食|冰淇淋|大闸蟹|糖葫芦|长寿面|西瓜|火锅|月饼|粽子|年糕|青团|腊八粥|重阳糕|汤圆|饺子|讨糖/, 'chibi-eat', 'munch'],
  [/写代码|轻快记录/, 'chibi-work', 'shake'],
  [/照镜子|整体换装试色/, 'nahida-girl', 'sway'],
  [/撸猫|动物环绕|鲸鱼吐泡泡|蓝鲸现世/, 'chibi-aranara', 'breathe'],
  [/被吓一跳/, 'chibi-sad', 'sway'],
  [/被落叶淹没|玩游戏气急败坏/, 'chibi-sad', 'droop'],
  [/工作|忙碌|整理/, 'chibi-work', 'shake'],
  [/思考|观察|问|求教/, 'chibi-think', 'breathe'],
  [/舞|跳|跃|摇摆|哼歌|伸懒腰|旋转|放风筝|放烟花|放河灯|孔明灯|圣诞树|舞狮|变鸽子|魔术|凭空生花/, 'chibi-happy', 'jump'],
  [/魔方|玩具|水枪|小提琴|气球|礼物|陀螺|笛子|蝴蝶|木马|抛接|毽子|五子棋|秋千|雪人|红包|福字|乞巧|茱萸|幽灵|敲击|下蹲/, 'chibi-happy', 'sway'],
];

function classify(name) {
  for (const [pattern, pose, recipe] of CLASSIFIERS) {
    if (pattern.test(name)) return { pose, recipe };
  }
  return { pose: 'chibi-idle', recipe: 'breathe' };
}

const TEXT_OVERLAYS = new Map([
  ['是啊，吃什么', '是啊，吃什么'],
  ['深度思考碎碎念', '深度思考碎碎念'],
]);

function collectAnimationNames(animations) {
  const names = [
    ...animations.idle,
    ...animations.turn,
    ...animations.drag,
    ...animations.clicks,
    ...animations.moves.actions.map((a) => a.name),
    ...animations.categories.flatMap((c) => c.actions),
    ...Object.values(animations.events).flat().flat(),
  ];
  return [...new Set(names)];
}

const main = readMainConfig();
const names = collectAnimationNames(main.animations);
if (names.length !== 106) throw new Error(`expected 106 animation names from main config, got ${names.length}`);

mkdirSync(outputDir, { recursive: true });

const only = new Set(process.argv.slice(2));
const jobs = names
  .filter((name) => only.size === 0 || only.has(name))
  .map((name) => {
    const { pose, recipe } = classify(name);
    const motion = RECIPES[recipe](seedOf(name));
    return {
      source: join(sourceDir, `${pose}.png`),
      output: join(outputDir, `${name}.webm`),
      ...motion,
      text: TEXT_OVERLAYS.get(name),
    };
  });

for (const job of jobs) {
  if (!existsSync(job.source)) throw new Error(`Missing source portrait: ${job.source}`);
}

let built = 0;
for (const job of jobs) {
  const drawtext = job.text
    ? `,drawtext=fontfile='${fontFile}':text='${job.text}':fontsize=30:fontcolor=white:borderw=2:bordercolor=0x2f5d3a:x=(w-text_w)/2:y=h-54`
    : '';
  const cropY = job.y.replace('(oh-ih)', '(in_h-360)');
  const filter =
    `[0:v]format=rgba,scale=-2:310,rotate=${job.rot}:c=none,` +
    // pad 建立透明大画布（alpha 0），crop 窗口逐帧移动实现动作（pad 的 x/y 不支持逐帧表达式）
    `pad=680:400:x=(ow-iw)/2:y=(oh-ih)-20:color=0x00000000,` +
    `crop=640:360:x=(in_w-640)/2:y=${cropY}${drawtext},format=yuva420p[out]`;
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-loop', '1', '-framerate', '24', '-i', job.source,
    '-filter_complex', filter,
    '-map', '[out]', '-t', '10', '-an',
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
    '-b:v', '0', '-crf', '32', '-auto-alt-ref', '0', '-row-mt', '1',
    job.output,
  ];
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${job.output}: ${result.status}`);
  built++;
  if (built % 10 === 0 || built === jobs.length) console.log(`Built ${built}/${jobs.length}`);
}
console.log('All Nahida animations built.');

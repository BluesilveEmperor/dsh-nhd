import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { readMainConfig } from '../build-nhd-config.mjs';

const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const petDir = join(packageRoot, 'pet');
const config = JSON.parse(readFileSync(join(petDir, 'nhd-config.json'), 'utf8'));
const animationDir = join(petDir, 'nhd-animation');

function referencedAnimations(animations) {
  const names = [
    ...animations.idle,
    ...animations.turn,
    ...animations.drag,
    ...animations.clicks,
    ...animations.moves.actions.map((action) => action.name),
    ...animations.categories.flatMap((category) => category.actions),
    ...Object.values(animations.events).flat().flat(),
  ];
  return new Set(names);
}

test('nhd config has a unique runnable pet with all capability switches aligned', () => {
  assert.equal(config.pets.length, 1);
  assert.equal(config.pets[0].id, 'nhd');
  assert.equal(config.pets[0].balanceEnabled, true);
  assert.equal(config.pets[0].whisperEnabled, true);
  assert.equal(config.pets[0].workStatusEnabled, true);
  assert.ok(Array.isArray(config.workStatusTexts) && config.workStatusTexts.length === 6);
});

test('nhd animations and weights are deep-equal to main config (full capability parity)', () => {
  const main = readMainConfig(packageRoot);
  assert.deepEqual(config.animations, main.animations);
  assert.deepEqual(config.animationWeights, main.animationWeights);
});

test('every configured nhd animation exists and every shipped animation is used (106 slots)', () => {
  const referenced = referencedAnimations(config.animations);
  assert.equal(referenced.size, 106);
  const shipped = readdirSync(animationDir).filter((name) => name.endsWith('.webm'));
  for (const name of referenced) {
    assert.ok(existsSync(join(animationDir, `${name}.webm`)), `missing animation: ${name}`);
  }
  assert.deepEqual(new Set(shipped.map((name) => name.slice(0, -5))), referenced);
});

test('sampled nhd webm keeps a real alpha channel (regression: opaque background)', (t) => {
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-version'], { encoding: 'utf8' });
  if (probe.error) {
    t.skip('ffmpeg unavailable');
    return;
  }
  for (const name of ['待机呼吸休闲', '是啊，吃什么']) {
    const result = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'info', '-y', '-ss', '2',
      '-c:v', 'libvpx-vp9', '-i', join(animationDir, `${name}.webm`),
      '-vf', 'alphaextract,signalstats,metadata=mode=print',
      '-frames:v', '1', '-f', 'null', '-',
    ], { encoding: 'utf8' });
    const log = `${result.stdout}\n${result.stderr}`;
    assert.match(log, /YMIN=0\b/, `${name}: alpha minimum must be 0 (fully transparent pixels)`);
    assert.match(log, /YMAX=255\b/, `${name}: alpha maximum must be 255 (opaque character pixels)`);
  }
});

test('nhd source portraits are present', () => {
  for (const name of [
    'chibi-idle', 'chibi-happy', 'chibi-drag', 'chibi-aranara', 'chibi-sleep',
    'chibi-sad', 'chibi-whisper', 'chibi-think', 'chibi-work', 'chibi-eat', 'nahida-girl',
  ]) {
    assert.ok(existsSync(join(packageRoot, 'assets', 'nhd', `${name}.png`)), `missing portrait: ${name}`);
  }
});

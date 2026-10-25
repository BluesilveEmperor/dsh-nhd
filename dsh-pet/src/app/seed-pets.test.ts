import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { bundledPetTargetDir, seedBundledPets } from './seed-pets.ts';

function makePackageRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dsh-pet-seed-'));
  const petDir = join(root, 'pet');
  mkdirSync(join(petDir, 'nhd-animation'), { recursive: true });
  writeFileSync(join(petDir, 'nhd-config.json'), '{"pets":[]}');
  writeFileSync(join(petDir, 'nhd-animation', 'idle.webm'), 'webm');
  // 故意缺动画目录的种类：应被跳过
  writeFileSync(join(petDir, 'broken-config.json'), '{"pets":[]}');
  return root;
}

test('seedBundledPets copies config + animation dir once and skips afterwards', () => {
  const packageRoot = makePackageRoot();
  const home = join(packageRoot, 'home');
  const targetDir = bundledPetTargetDir(home);

  const first = seedBundledPets(packageRoot, home);
  assert.deepEqual(first.installed, ['nhd']);
  assert.equal(readFileSync(join(targetDir, 'nhd-config.json'), 'utf8'), '{"pets":[]}');
  assert.equal(readFileSync(join(targetDir, 'nhd-animation', 'idle.webm'), 'utf8'), 'webm');
  assert.ok(!existsSync(join(targetDir, 'broken-config.json')), 'missing-animation pack must not be seeded');

  const second = seedBundledPets(packageRoot, home);
  assert.deepEqual(second.installed, [], 'second run must skip existing packs');
});

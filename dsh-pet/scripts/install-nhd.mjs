import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(packageRoot, 'pet');
const dshHome = process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), '.dsh');
const targetDir = join(dshHome, 'dsh-pet', 'pet');
const targetConfig = join(targetDir, 'nhd-config.json');
const force = process.argv.includes('--force');

if (existsSync(targetConfig) && !force) {
  throw new Error(`Nahida pet pack already exists: ${targetConfig}\nUse --force to overwrite this pack.`);
}

const animations = readdirSync(join(sourceDir, 'nhd-animation')).filter((name) => name.endsWith('.webm'));
if (animations.length === 0) {
  throw new Error('No Nahida animations found. Run npm run pet:nhd:build first.');
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(join(sourceDir, 'nhd-config.json'), targetConfig);
cpSync(join(sourceDir, 'nhd-animation'), join(targetDir, 'nhd-animation'), {
  recursive: true,
  force,
  errorOnExist: !force,
});

console.log(`Installed Nahida pet pack (${animations.length} animations) to ${targetDir}`);
console.log('Reload the desktop helper or restart DSH to discover the nhd pet.');

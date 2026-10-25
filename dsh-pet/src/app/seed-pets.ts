/**
 * 打包应用首次启动时，把包内自带的 pet pack（如纳西妲 nhd）播种到用户数据目录。
 *
 * 为什么需要：文件宠物的扫描与素材查找都只认 `$DSH_HOME/dsh-pet/pet/`（与 DSH 插件模式
 * 同一份目录契约），打包应用里即便带了 `pet/**`，宿主也扫不到包内路径。播种 = 首次启动
 * 把包内 `<名>-config.json(c)` + `<名>-animation/` 复制过去；已存在的条目**一律跳过**
 * （用户手改/后续版本更新都不覆盖，更新需用户手动删除或用 `npm run pet:nhd:install -- --force`）。
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** 扫描结果 */
export interface BundledPetPack {
  /** 包内 pet/ 目录 */
  sourceDir: string;
  /** 本次实际播种的宠物种类名（前缀），按文件名排序 */
  installed: string[];
}

/** 包内 pet pack 目标目录：与 host/config.ts 的 petDir 推导同一口径 */
export function bundledPetTargetDir(home: string): string {
  return join(home, 'dsh-pet', 'pet');
}

/** 包内 pet pack 的配置文件名模式（与 host/config.ts scanPetFiles 同一套规则） */
const CONFIG_PATTERN = /^.+?-config\.(json|jsonc)$/;

export function seedBundledPets(packageRoot: string, home: string): BundledPetPack {
  const sourceDir = join(packageRoot, 'pet');
  const result: BundledPetPack = { sourceDir, installed: [] };
  let entries;
  try {
    entries = readdirSync(sourceDir, { withFileTypes: true });
  } catch {
    return result; // 包内没有 pet/ = 没有自带宠物包
  }
  const targetDir = bundledPetTargetDir(home);
  mkdirSync(targetDir, { recursive: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !CONFIG_PATTERN.test(entry.name)) continue;
    const stem = entry.name.replace(/-config\.(json|jsonc)$/, '');
    const targetConfig = join(targetDir, entry.name);
    if (existsSync(targetConfig)) continue; // 已存在：绝不覆盖
    const animationSource = join(sourceDir, `${stem}-animation`);
    if (!existsSync(animationSource)) continue; // 缺素材目录：按 host 规则该条目加载会报错，直接不装
    copyFileSync(join(sourceDir, entry.name), targetConfig);
    cpSync(animationSource, join(targetDir, `${stem}-animation`), { recursive: true, errorOnExist: true, force: false });
    result.installed.push(stem);
  }
  return result;
}

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathExists } from './utils/fs-utils.js';

export interface WptsConfig {
  entry?: string;
  outDir?: string;
  clean?: boolean;
  adminSrcDir?: string;
}

const CONFIG_FILES = ['wpts.config.js', 'wpts.config.json'];

export async function loadConfig(baseDir: string): Promise<WptsConfig | null> {
  for (const filename of CONFIG_FILES) {
    const configPath = path.resolve(baseDir, filename);
    if (await pathExists(configPath)) {
      if (filename.endsWith('.json')) {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
      }
      const mod = await import(configPath);
      return mod.default ?? mod;
    }
  }
  return null;
}

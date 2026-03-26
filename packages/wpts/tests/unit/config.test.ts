import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wpts-config-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('returns null when no config file exists', async () => {
    const config = await loadConfig(tmpDir);
    expect(config).toBeNull();
  });

  it('loads wpts.config.json', async () => {
    const configData = {
      entry: 'src/my-plugin.ts',
      outDir: './build',
      clean: true,
    };
    await fs.writeFile(path.join(tmpDir, 'wpts.config.json'), JSON.stringify(configData));

    const config = await loadConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.entry).toBe('src/my-plugin.ts');
    expect(config!.outDir).toBe('./build');
    expect(config!.clean).toBe(true);
  });

  it('loads wpts.config.json with partial options', async () => {
    const configData = { outDir: './output' };
    await fs.writeFile(path.join(tmpDir, 'wpts.config.json'), JSON.stringify(configData));

    const config = await loadConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.outDir).toBe('./output');
    expect(config!.entry).toBeUndefined();
  });
});

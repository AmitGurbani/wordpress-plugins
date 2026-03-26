import path from 'node:path';
import chalk from 'chalk';
import { watch as chokidarWatch } from 'chokidar';
import { type BuildOptions, build } from '../compiler/pipeline.js';

export async function watchProject(file: string, options: BuildOptions): Promise<void> {
  const entryPath = path.resolve(file);
  const watchDir = path.dirname(entryPath);

  // Initial build
  console.log(chalk.blue('Starting initial build...'));
  await runBuild(entryPath, options);

  // Watch for changes
  console.log(chalk.blue(`\nWatching ${watchDir} for changes...\n`));

  const watcher = chokidarWatch(watchDir, {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/dist/**'],
  });

  watcher.on('change', async (changedPath) => {
    console.log(chalk.yellow(`\nFile changed: ${path.relative(watchDir, changedPath)}`));
    await runBuild(entryPath, options);
  });

  watcher.on('add', async (addedPath) => {
    console.log(chalk.yellow(`\nFile added: ${path.relative(watchDir, addedPath)}`));
    await runBuild(entryPath, options);
  });

  watcher.on('unlink', async (removedPath) => {
    console.log(chalk.yellow(`\nFile removed: ${path.relative(watchDir, removedPath)}`));
    await runBuild(entryPath, options);
  });
}

async function runBuild(entryPath: string, options: BuildOptions): Promise<void> {
  const start = Date.now();
  const result = await build({ ...options, entry: entryPath });

  for (const d of result.diagnostics.getAll()) {
    const prefix =
      d.level === 'error'
        ? chalk.red('ERROR')
        : d.level === 'warning'
          ? chalk.yellow('WARN')
          : 'INFO';
    console.log(`  [${prefix}] ${d.code}: ${d.message}`);
  }

  if (result.success) {
    console.log(
      chalk.green(`Build succeeded in ${Date.now() - start}ms (${result.files.length} files)`),
    );
  } else {
    console.log(chalk.red('Build failed. Watching for changes...'));
  }
}

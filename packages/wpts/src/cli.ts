import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './compiler/pipeline.js';
import { loadConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('wpts')
  .description('TypeScript-to-WordPress-Plugin transpiler')
  .version(pkg.version);

program
  .command('init')
  .description('Scaffold a new wpts project')
  .argument('[directory]', 'Project directory', '.')
  .option('--name <name>', 'Plugin name')
  .option('--slug <slug>', 'Plugin slug')
  .option('--author <author>', 'Author name')
  .action(async (directory: string, options: { name?: string; slug?: string; author?: string }) => {
    const { initProject } = await import('./commands/init.js');
    await initProject(directory, options);
  });

program
  .command('build')
  .description('Transpile TypeScript to WordPress plugin')
  .argument('[file]', 'Entry TypeScript file')
  .option('-o, --outDir <dir>', 'Output directory')
  .option('--clean', 'Clean output directory before build')
  .action(async (file: string | undefined, options: { outDir?: string; clean?: boolean }) => {
    const config = await loadConfig(process.cwd()) ?? {};

    const entryPath = resolve(file ?? config.entry ?? 'src/plugin.ts');
    const outDir = resolve(options.outDir ?? config.outDir ?? './dist');
    const clean = options.clean ?? config.clean;

    console.log(`Building plugin from ${file ?? config.entry ?? 'src/plugin.ts'}...`);

    const result = await build({
      entry: entryPath,
      outDir,
      clean,
      adminSrcDir: config.adminSrcDir,
    });

    // Print diagnostics
    const diags = result.diagnostics.getAll();
    for (const d of diags) {
      const prefix = d.level === 'error' ? 'ERROR' : d.level === 'warning' ? 'WARN' : 'INFO';
      console.log(`  [${prefix}] ${d.code}: ${d.message}`);
      if (d.suggestion) {
        console.log(`    Suggestion: ${d.suggestion}`);
      }
    }

    if (result.success) {
      console.log(`\nBuild successful! Generated ${result.files.length} files to ${outDir}`);
      console.log('\nGenerated files:');
      for (const f of result.files) {
        console.log(`  ${f.relativePath}`);
      }
      console.log('\nNext steps:');
      console.log('  1. Copy the plugin directory to wp-content/plugins/');
      console.log('  2. If using admin React pages, run: cd admin/js && npm install && npm run build');
      console.log('  3. Activate the plugin in WordPress admin');
    } else {
      console.error('\nBuild failed. Fix the errors above and try again.');
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Check TypeScript source without generating output')
  .argument('[file]', 'Entry TypeScript file')
  .option('--strict', 'Fail on warnings too')
  .action(async (file: string | undefined, options: { strict?: boolean }) => {
    const { parseSourceFile } = await import('./compiler/parser.js');
    const { extractDecorators } = await import('./compiler/decorator-extractor.js');
    const { DiagnosticCollection } = await import('./compiler/diagnostics.js');

    const config = await loadConfig(process.cwd()) ?? {};
    const entryPath = resolve(file ?? config.entry ?? 'src/plugin.ts');
    console.log(`Validating ${file ?? config.entry ?? 'src/plugin.ts'}...`);

    try {
      const parsed = parseSourceFile(entryPath);
      const diagnostics = new DiagnosticCollection();
      extractDecorators(parsed.sourceFile, parsed.typeChecker, diagnostics);

      const diags = diagnostics.getAll();
      for (const d of diags) {
        const prefix = d.level === 'error' ? 'ERROR' : d.level === 'warning' ? 'WARN' : 'INFO';
        console.log(`  [${prefix}] ${d.code}: ${d.message}`);
      }

      const hasIssues = diagnostics.hasErrors() || (options.strict && diagnostics.getWarnings().length > 0);
      if (hasIssues) {
        console.error('\nValidation failed.');
        process.exit(1);
      } else {
        console.log('\nValidation passed.');
      }
    } catch (err: any) {
      console.error(`  [ERROR] ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch source files and rebuild on changes')
  .argument('[file]', 'Entry TypeScript file')
  .option('-o, --outDir <dir>', 'Output directory')
  .action(async (file: string | undefined, options: { outDir?: string }) => {
    const config = await loadConfig(process.cwd()) ?? {};
    const entry = file ?? config.entry ?? 'src/plugin.ts';
    const outDir = resolve(options.outDir ?? config.outDir ?? './dist');

    const { watchProject } = await import('./commands/watch.js');
    await watchProject(entry, {
      entry: resolve(entry),
      outDir,
      adminSrcDir: config.adminSrcDir,
    });
  });

export { program };

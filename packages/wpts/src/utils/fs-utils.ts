import path from 'node:path';
import archiver from 'archiver';
import fs from 'fs-extra';

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Write a file, creating parent directories as needed.
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Copy a file or directory.
 */
export async function copyPath(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

/**
 * Remove a directory recursively.
 */
export async function cleanDir(dirPath: string): Promise<void> {
  await fs.remove(dirPath);
}

/**
 * Read a file as UTF-8 string.
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Move a file or directory (uses rename on same filesystem, falls back to copy).
 */
export async function movePath(src: string, dest: string): Promise<void> {
  await fs.move(src, dest, { overwrite: true });
}

/**
 * Check if a path exists.
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

/**
 * Zip a directory into a .zip file.
 * @param sourceDir - Absolute path to the directory to zip
 * @param outPath - Absolute path for the output .zip file
 * @param dirName - Name of the root folder inside the zip
 */
export async function zipDir(sourceDir: string, outPath: string, dirName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', (err) => reject(err));
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, dirName);
    archive.finalize();
  });
}

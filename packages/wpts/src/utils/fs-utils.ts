import fs from 'fs-extra';
import path from 'node:path';

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
 * Check if a path exists.
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

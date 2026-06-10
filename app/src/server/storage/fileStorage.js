import path from 'node:path';
import { promises as fs } from 'node:fs';

export function getProjectPath(...parts) {
  return path.join(process.cwd(), ...parts);
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

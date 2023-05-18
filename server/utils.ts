import fs from 'node:fs';

export const src = new URL('../app/', import.meta.url);
export const dist = new URL('../dist/', import.meta.url);

export function resolveSrc(path: string) {
  return new URL(path, src);
}

export function resolveDist(path: string) {
  return new URL(path, dist);
}

export function resolveClientDist(path: string) {
  return new URL(path, resolveDist('client/'));
}

export function resolveServerDist(path: string) {
  return new URL(path, resolveDist('server/'));
}

export const clientComponentMapUrl = resolveDist('clientComponentMap.json');

export type BundleMap = Record<
  string,
  {
    id: string;
    chunks: string[];
    name: 'default'; // TODO support named exports
    async: true;
  }
>;

export async function writeClientComponentMap(bundleMap: BundleMap) {
  await fs.promises.writeFile(clientComponentMapUrl, JSON.stringify(bundleMap));
}

export async function readClientComponentMap(): Promise<BundleMap> {
  const bundleMap = await fs.promises.readFile(clientComponentMapUrl, 'utf-8');
  return JSON.parse(bundleMap);
}

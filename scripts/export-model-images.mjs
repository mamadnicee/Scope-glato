import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const port = 5187;
const url = `http://127.0.0.1:${port}/`;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: 'ignore' }
);
let browser;

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('Vite exited before startup');
    try {
      const response = await fetch(url);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Wait for the local dev server to open its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error('Vite did not start on port 5187');

  browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Export the exact Three.js models already used by the interactive hero.
  const images = await page.evaluate(async () => {
    const [{ Engine }, { FLAVORS, TOPPING_LABELS }] = await Promise.all([
      import('/src/three/engine.ts'),
      import('/src/three/flavors.ts'),
    ]);
    const flavors = Engine.renderThumbnails().map((data, index) => ({
      name: `flavor-${FLAVORS[index].id}.png`,
      data,
    }));
    const toppings = Engine.renderToppingThumbnails();
    return [
      ...flavors,
      ...Object.keys(TOPPING_LABELS).map((kind) => ({
        name: `topping-${kind}.png`,
        data: toppings[kind],
      })),
    ];
  });

  const directory = path.resolve('public/images');
  const embedded = path.resolve('src/assets/images');
  // خروجی نهایی تصاویر را از src/assets درون‌خطی می‌کند؛ public نسخه قابل مشاهده است.
  await rm(directory, { recursive: true, force: true });
  await rm(embedded, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await mkdir(embedded, { recursive: true });
  for (const { name, data } of images) {
    if (!data?.startsWith('data:image/png;base64,')) throw new Error(`Invalid render: ${name}`);
    await writeFile(path.join(directory, name), Buffer.from(data.split(',')[1], 'base64'));
    await writeFile(path.join(embedded, name), Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(`Saved ${images.length} matching model renders in public/images/ and src/assets/images/`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const oldBase = process.env.OLD_BASE_URL || 'http://localhost:2010';
const nextBase = process.env.NEXT_BASE_URL || 'http://localhost:2011';
const outDir = path.resolve(process.cwd(), 'test-results', 'compare');

const routes = [
  '/',
  '/product',
  '/product/nhet-tai-cu',
  '/posts',
  '/policy/warranty',
  '/sale',
];

const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const ignoredFailedRequestPatterns = [
  'https://csp.withgoogle.com/',
];

function url(base, route) {
  return new URL(route, base).toString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function capture(page, targetUrl, filePath) {
  const events = { consoleErrors: [], pageErrors: [], failedRequests: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') events.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => {
    events.pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    if (ignoredFailedRequestPatterns.some((pattern) => request.url().startsWith(pattern))) return;
    const failure = request.failure();
    events.failedRequests.push(`${request.method()} ${request.url()} ${failure?.errorText || ''}`.trim());
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        scroll-behavior: auto !important;
      }
      iframe, video { visibility: hidden !important; }
    `,
  });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: filePath,
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
  });

  return events;
}

async function comparePng(oldPath, nextPath, diffPath) {
  const [oldBuffer, nextBuffer] = await Promise.all([fs.readFile(oldPath), fs.readFile(nextPath)]);
  const oldPng = PNG.sync.read(oldBuffer);
  const nextPng = PNG.sync.read(nextBuffer);
  if (oldPng.width !== nextPng.width || oldPng.height !== nextPng.height) {
    return {
      width: oldPng.width,
      height: oldPng.height,
      nextWidth: nextPng.width,
      nextHeight: nextPng.height,
      diffPixels: Number.POSITIVE_INFINITY,
      diffRatio: 1,
      sizeMismatch: true,
    };
  }

  const diff = new PNG({ width: oldPng.width, height: oldPng.height });
  const diffPixels = pixelmatch(oldPng.data, nextPng.data, diff.data, oldPng.width, oldPng.height, {
    threshold: 0.12,
    includeAA: false,
  });
  await fs.writeFile(diffPath, PNG.sync.write(diff));
  const totalPixels = oldPng.width * oldPng.height;
  return {
    width: oldPng.width,
    height: oldPng.height,
    diffPixels,
    diffRatio: diffPixels / totalPixels,
    sizeMismatch: false,
  };
}

function safeName(route) {
  return route === '/' ? 'home' : route.replace(/^\/+/, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

async function main() {
  await ensureDir(outDir);
  const browser = await chromium.launch();
  const report = [];

  for (const viewport of viewports) {
    for (const route of routes) {
      const name = `${viewport.name}-${safeName(route)}`;
      const oldPath = path.join(outDir, `${name}-old.png`);
      const nextPath = path.join(outDir, `${name}-next.png`);
      const diffPath = path.join(outDir, `${name}-diff.png`);

      const context = await browser.newContext({ viewport });
      const oldPage = await context.newPage();
      const oldEvents = await capture(oldPage, url(oldBase, route), oldPath);
      await context.close();

      const nextContext = await browser.newContext({ viewport });
      const nextPage = await nextContext.newPage();
      const nextEvents = await capture(nextPage, url(nextBase, route), nextPath);
      await nextContext.close();

      const diff = await comparePng(oldPath, nextPath, diffPath);
      report.push({
        route,
        viewport: viewport.name,
        oldUrl: url(oldBase, route),
        nextUrl: url(nextBase, route),
        diff,
        oldEvents,
        nextEvents,
        files: {
          old: oldPath,
          next: nextPath,
          diff: diffPath,
        },
      });
    }
  }

  await browser.close();
  const reportPath = path.join(outDir, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`Compare report: ${reportPath}`);
  for (const item of report) {
    const pct = (item.diff.diffRatio * 100).toFixed(2);
    const errorCount =
      item.oldEvents.consoleErrors.length +
      item.oldEvents.pageErrors.length +
      item.nextEvents.consoleErrors.length +
      item.nextEvents.pageErrors.length +
      item.nextEvents.failedRequests.length;
    console.log(`${item.viewport.padEnd(7)} ${item.route.padEnd(18)} diff=${pct}% errors=${errorCount}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5188;
const url = `http://127.0.0.1:${port}/`;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: 'ignore' }
);
let browser;

const measure = () => {
  const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
  const hero = rect('.hero-box');
  const cta = rect('.cta-group');
  const stage = rect('.hero-stage');
  const cards = rect('.carousel-cards');
  const nav = rect('.carousel-nav');
  const visibleCards = [...document.querySelectorAll('.carousel-cards .card')].filter(
    (card) => getComputedStyle(card).display !== 'none'
  );
  return {
    heroBottom: hero.bottom,
    ctaBottom: cta.bottom,
    stageTop: stage.top,
    stageBottom: stage.bottom,
    cardsTop: cards.top,
    cardsHeight: cards.height,
    visibleCards: visibleCards.length,
    cardHeights: visibleCards.map((card) => card.getBoundingClientRect().height),
    navBottom: nav.bottom,
    flavorsTop: rect('#flavors').top,
    pageWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    fruitVisible: getComputedStyle(document.querySelector('.layer-front')).display !== 'none',
    imagesLoaded: [...document.querySelectorAll('.card img')].every(
      (img) => img.complete && img.naturalWidth > 0
    ),
    nextFlavor: document.querySelector('.card.active .card-fa')?.textContent,
    scrollY: window.scrollY,
  };
};

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('Vite exited before startup');
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {
      // Wait for the local server.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, 'Vite did not start');

  browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });

  for (const [label, width, height, cycle] of [
    ['phone', 390, 844, true],
    ['short-phone', 375, 667, false],
    ['small-phone', 320, 568, false],
    ['desktop', 1440, 900, true],
    ['short-desktop', 1366, 650, false],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.card img').length === 3);
    await page.waitForFunction(
      () => [...document.querySelectorAll('.card img')].every((img) => img.complete && img.naturalWidth > 0)
    );

    const check = (m, flavor) => {
      assert(m.imagesLoaded, `${label} / ${flavor}: missing image`);
      assert(m.pageWidth <= width + 1, `${label} / ${flavor}: horizontal overflow`);
      assert(m.navBottom <= m.heroBottom - 6, `${label} / ${flavor}: nav clipped`);
      assert(Math.abs(m.heroBottom - m.flavorsTop) < 2, `${label} / ${flavor}: gap after hero`);
      if (width <= 900) {
        assert(m.fruitVisible, `${label} / ${flavor}: mobile fruit hidden`);
        assert(m.stageTop >= m.ctaBottom - 2, `${label} / ${flavor}: model overlaps CTA`);
        assert(m.cardsTop >= m.stageBottom - 2, `${label} / ${flavor}: model overlaps cards`);
      }
    };

    let m = await page.evaluate(measure);
    check(m, 'initial');
    const initialCardsHeight = m.cardsHeight;
    const initialPageHeight = m.pageHeight;
    const initialScroll = m.scrollY;
    await page.locator('.card.active').dispatchEvent('click');
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.scrollY), initialScroll, `${label}: active card moved page`);
    if (cycle) {
      for (let i = 0; i < 9; i++) {
        await page.locator('.nav-arrow[aria-label="طعم بعدی"]').click();
        await page.waitForFunction(
          () => document.querySelector('.layer-hero')?.dataset.transitioning === 'false',
          null,
          { timeout: 20000 }
        );
        m = await page.evaluate(measure);
        check(m, `flavor ${i + 1}`);
        assert.equal(m.scrollY, initialScroll, `${label}: flavor switch moved page`);
        assert(Math.abs(m.pageHeight - initialPageHeight) < 2, `${label}: flavor switch changed page height`);
        assert(Math.abs(m.cardsHeight - initialCardsHeight) < 1, `${label}: card rail height changed`);
        assert(m.cardHeights.every((h) => Math.abs(h - m.cardHeights[0]) < 1), `${label}: uneven cards`);
      }
    }

    await page.evaluate(() => document.querySelector('#ingredients').scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(800);
    const afterScroll = await page.evaluate(() => ({
      heroBottom: document.querySelector('.hero-box').getBoundingClientRect().bottom,
      ingredientsVisible: document.querySelector('#ingredients').getBoundingClientRect().top < innerHeight,
      ingredientCount: document.querySelectorAll('.ing-card img').length,
      sectionOpacity: Number(getComputedStyle(document.querySelector('#ingredients .sec-head')).opacity),
    }));
    assert(afterScroll.heroBottom < 0, `${label}: hero remains on screen while scrolling`);
    assert(afterScroll.ingredientsVisible && afterScroll.ingredientCount === 8, `${label}: ingredients missing`);
    assert(afterScroll.sectionOpacity > 0.4, `${label}: content hidden after scrolling`);

    await page.evaluate(() => document.querySelector('#flavors').scrollIntoView({ behavior: 'instant' }));
    const flavorSection = await page.evaluate(() => ({
      opacity: Number(getComputedStyle(document.querySelector('.fg-card')).opacity),
      visible: document.querySelector('#flavors .sec-title').getBoundingClientRect().top < innerHeight,
      count: document.querySelectorAll('.fg-card').length,
    }));
    assert(flavorSection.visible && flavorSection.count === 9, `${label}: flavors missing`);
    assert(flavorSection.opacity > 0.4, `${label}: flavor grid invisible`);

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    const footer = await page.evaluate(() => {
      const rect = document.querySelector('.footer-bottom').getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top, height: innerHeight };
    });
    assert(footer.top < footer.height && footer.bottom <= footer.height + 2, `${label}: footer clipped`);
    assert.deepEqual(errors, [], `${label}: runtime errors`);
    console.log(`${label}: hero, ${cycle ? '9 flavors, ' : ''}assets and scrolling OK`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
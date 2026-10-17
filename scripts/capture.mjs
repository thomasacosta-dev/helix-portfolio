import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const BASE_URL = 'http://localhost:4321/';
const OUT_DIR = path.resolve('public/screenshots');
const BRAIN_DIR = 'C:\\Users\\felipe\\.gemini\\antigravity-ide\\brain\\476bcae9-c55e-40ed-a5b0-da6d843da396';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(BRAIN_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureDesktop() {
  console.log('\n--- CAPTURING DESKTOP (1440x900) ---');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-desktop-'));

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpProfile}`,
    '--window-size=1440,900',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Page.navigate', { url: BASE_URL });
    await sleep(2500);

    // Skip preloader
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-preloader-skip]')?.click();
        document.querySelector('[data-preloader]')?.classList.add('is-done');
      `,
    });

    // Wait until HelixScene is initialized
    for (let i = 0; i < 20; i++) {
      const { result } = await send('Runtime.evaluate', {
        expression: `Boolean(window.__HELIX_READY__)`,
        returnByValue: true,
      });
      if (result?.value) break;
      await sleep(250);
    }

    await sleep(300);

    // Moment 1: Swarm / Dispersión inicial
    console.log('Capturing Moment 1: Initial dispersion / swarm...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, '01_desktop_swarm_1440x900.png'), Buffer.from(shot1.data, 'base64'));
    fs.writeFileSync(path.join(BRAIN_DIR, '01_desktop_swarm_1440x900.png'), Buffer.from(shot1.data, 'base64'));

    // Moment 2: Halfway formation (~2.7s)
    console.log('Waiting 2.6s for Moment 2: Halfway formation...');
    await sleep(2600);
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, '02_desktop_halfway_1440x900.png'), Buffer.from(shot2.data, 'base64'));
    fs.writeFileSync(path.join(BRAIN_DIR, '02_desktop_halfway_1440x900.png'), Buffer.from(shot2.data, 'base64'));

    // Moment 3: Formed helix (~5.5s total)
    console.log('Waiting 3.2s for Moment 3: Fully formed helix...');
    await sleep(3200);
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, '03_desktop_formed_1440x900.png'), Buffer.from(shot3.data, 'base64'));
    fs.writeFileSync(path.join(BRAIN_DIR, '03_desktop_formed_1440x900.png'), Buffer.from(shot3.data, 'base64'));

    // Scroll FPS measurement
    console.log('Measuring FPS during scroll...');
    const fpsResult = await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          const frames = [];
          let last = performance.now();
          let scrollPos = 0;
          const start = performance.now();
          function tick() {
            const now = performance.now();
            frames.push(now - last);
            last = now;
            scrollPos += 14;
            window.scrollTo(0, scrollPos);
            if (now - start < 1500) {
              requestAnimationFrame(tick);
            } else {
              const fpsValues = frames.slice(1).map(d => 1000 / d);
              const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
              const minFps = Math.min(...fpsValues);
              const maxFps = Math.max(...fpsValues);
              const dropped = fpsValues.filter(f => f < 45).length;
              resolve({
                avgFps: Math.round(avgFps * 10) / 10,
                minFps: Math.round(minFps * 10) / 10,
                maxFps: Math.round(maxFps * 10) / 10,
                frameCount: frames.length,
                droppedFrames: dropped,
                scrollY: window.scrollY
              });
            }
          }
          requestAnimationFrame(tick);
        });
      `,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('Desktop Scroll FPS:', fpsResult.result.value);

    // Moment 4: Scrolled dispersion (verifying no straight edge)
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 320); window.dispatchEvent(new Event('scroll'));` });
    await sleep(400);
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, '04_desktop_scroll_disperse_1440x900.png'), Buffer.from(shot4.data, 'base64'));
    fs.writeFileSync(path.join(BRAIN_DIR, '04_desktop_scroll_disperse_1440x900.png'), Buffer.from(shot4.data, 'base64'));

    ws.close();
    return fpsResult.result.value;
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
  }
}

async function captureMobile() {
  console.log('\n--- CAPTURING MOBILE (390x844) ---');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mobile-'));

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpProfile}`,
    '--window-size=390,844',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      scale: 1,
    });

    await send('Page.navigate', { url: BASE_URL });
    await sleep(2200);

    // Skip preloader
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-preloader-skip]')?.click();
        document.querySelector('[data-preloader]')?.classList.add('is-done');
      `,
    });
    await sleep(600);

    const mobileCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.querySelector('[data-helix-scene]');
          const canvas = document.querySelector('.helix-canvas');
          const fallback = document.querySelector('.helix-fallback');
          return {
            isStatic: root?.classList.contains('helix-static'),
            canvasDisplay: canvas ? window.getComputedStyle(canvas).display : null,
            fallbackDisplay: fallback ? window.getComputedStyle(fallback).display : null,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Mobile fallback check:', mobileCheck.result.value);

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, '05_mobile_fallback_390x844.png'), Buffer.from(shotMobile.data, 'base64'));
    fs.writeFileSync(path.join(BRAIN_DIR, '05_mobile_fallback_390x844.png'), Buffer.from(shotMobile.data, 'base64'));

    ws.close();
    return mobileCheck.result.value;
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  const fps = await captureDesktop();
  const mobile = await captureMobile();
  console.log('\n=========================================');
  console.log('SUMMARY RESULTS:');
  console.log('Scroll FPS:', fps);
  console.log('Mobile Fallback Check:', mobile);
  console.log('=========================================\n');
}

main().catch(console.error);

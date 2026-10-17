import { spawn } from 'node:child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1440,900',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

await new Promise(r => setTimeout(r, 1200));
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => { ws.onopen = r; });

let id = 1;
const send = (m, p = {}) => new Promise(res => {
  const myId = id++;
  const onm = (e) => {
    const d = JSON.parse(e.data);
    if (d.id === myId) { ws.removeEventListener('message', onm); res(d.result); }
  };
  ws.addEventListener('message', onm);
  ws.send(JSON.stringify({ id: myId, method: m, params: p }));
});

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:4321/' });
await new Promise(r => setTimeout(r, 2000));

await send('Runtime.evaluate', {
  expression: `
    document.querySelector('[data-preloader-skip]')?.click();
    document.querySelector('[data-preloader]')?.classList.add('is-done');
  `
});
await new Promise(r => setTimeout(r, 800));

// Initial status in hero
const initialStatus = await send('Runtime.evaluate', {
  expression: `(() => {
    const canvas = document.querySelector('.helix-canvas');
    return {
      scrollY: window.scrollY,
      canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
    };
  })()`,
  returnByValue: true
});
console.log('Initial status in Hero:', initialStatus.result.value);

// Scroll past hero into middle of page
await send('Runtime.evaluate', {
  expression: `
    window.scrollTo(0, 1600);
    window.dispatchEvent(new Event('scroll'));
  `
});
await new Promise(r => setTimeout(r, 1000));

const scrolledStatus = await send('Runtime.evaluate', {
  expression: `(() => {
    const canvas = document.querySelector('.helix-canvas');
    return {
      scrollY: window.scrollY,
      canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
    };
  })()`,
  returnByValue: true
});
console.log('Scrolled past Hero (middle of page):', scrolledStatus.result.value);

// Scroll to contact at bottom
await send('Runtime.evaluate', {
  expression: `
    const contact = document.querySelector('#contacto');
    if (contact) contact.scrollIntoView();
    window.dispatchEvent(new Event('scroll'));
  `
});
await new Promise(r => setTimeout(r, 1000));

const contactStatus = await send('Runtime.evaluate', {
  expression: `(() => {
    const canvas = document.querySelector('.helix-canvas');
    return {
      scrollY: window.scrollY,
      canvasOpacity: canvas ? window.getComputedStyle(canvas).opacity : null,
    };
  })()`,
  returnByValue: true
});
console.log('At Contact section (#contacto):', contactStatus.result.value);

ws.close();
chrome.kill();

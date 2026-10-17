import { spawn } from 'node:child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--force-device-scale-factor=1',
  '--window-size=390,844',
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

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, scale: 1 });
await send('Page.navigate', { url: 'http://localhost:4321/' });
await new Promise(r => setTimeout(r, 2000));

const evalRes = await send('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('[data-helix-scene]');
    return {
      className: el?.className,
      canvasDisplay: window.getComputedStyle(el.querySelector('canvas')).display,
      fallbackDisplay: window.getComputedStyle(el.querySelector('.helix-fallback')).display,
      isStatic: el?.classList.contains('helix-static')
    };
  })()`,
  returnByValue: true
});

console.log('Mobile evaluation:', evalRes.result.value);

ws.close();
chrome.kill();

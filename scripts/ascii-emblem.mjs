import { spawn } from 'node:child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--no-first-run',
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

await send('Page.navigate', { url: 'http://localhost:4321/' });
await new Promise(r => setTimeout(r, 1500));

const res = await send('Runtime.evaluate', {
  expression: `(async () => {
    const resp = await fetch('/helix-emblem.png');
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob);
    const cvs = new OffscreenCanvas(40, 40);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(bmp, 251, 0, 525, 757, 0, 0, 40, 40);
    const data = ctx.getImageData(0, 0, 40, 40).data;
    let ascii = '';
    for (let y = 0; y < 40; y++) {
      let line = '';
      for (let x = 0; x < 40; x++) {
        const a = data[(y * 40 + x) * 4 + 3];
        line += a > 128 ? '#' : (a > 30 ? '.' : ' ');
      }
      ascii += line + '\\n';
    }
    return ascii;
  })()`,
  awaitPromise: true,
  returnByValue: true
});

console.log(res.result.value);
ws.close();
chrome.kill();

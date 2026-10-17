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
    const w = bmp.width;
    const h = bmp.height;
    const cvs = new OffscreenCanvas(w, h);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    
    // Check center region (x: 460..560, y: 330..430)
    let centerPixels = 0;
    for (let y = 330; y < 430; y++) {
      for (let x = 460; x < 560; x++) {
        if (data[(y * w + x) * 4 + 3] > 40) centerPixels++;
      }
    }
    return { centerPixels };
  })()`,
  awaitPromise: true,
  returnByValue: true
});

console.log('Center pixels count in 100x100 box:', res.result.value);
ws.close();
chrome.kill();

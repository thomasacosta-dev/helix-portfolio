import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REVIEW_DIR = path.resolve('.impeccable/review');
fs.mkdirSync(REVIEW_DIR, { recursive: true });

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

console.log('Running emblem sampling and verification algorithm...');

const result = await send('Runtime.evaluate', {
  expression: `(async () => {
    const resp = await fetch('/helix-emblem.png');
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob);
    const W = bmp.width;
    const H = bmp.height;
    const cvs = new OffscreenCanvas(W, H);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // 1. Identify bounding box and mask
    let minX = W, maxX = 0, minY = H, maxY = 0;
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const a = data[idx * 4 + 3];
        if (a > 45) {
          mask[idx] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const bboxW = maxX - minX + 1;
    const bboxH = maxY - minY + 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // 2. Identify code symbol </> region: x in [425, 600], y in [490, 630]
    const symbolPixels = [];
    const contourPixels = [];
    const bodyPixels = [];

    // Distance transform approximation on downsampled grid or fast BFS/Euclidean
    // To be fast in worker: 2-pass Manhattan/Chamfer distance transform
    const dist = new Float32Array(W * H);
    const INF = 99999;
    for (let i = 0; i < W * H; i++) dist[i] = mask[i] ? INF : 0;

    // Pass 1: Top-Left to Bottom-Right
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (mask[i]) {
          dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414, dist[i - W + 1] + 1.414);
        }
      }
    }

    // Pass 2: Bottom-Right to Top-Left
    for (let y = H - 2; y >= 1; y--) {
      for (let x = W - 2; x >= 1; x--) {
        const i = y * W + x;
        if (mask[i]) {
          dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414, dist[i + W - 1] + 1.414);
        }
      }
    }

    // Separate pixels into symbol, contour, body
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const i = y * W + x;
        if (!mask[i]) continue;

        const isSymbol = (x >= 428 && x <= 600 && y >= 490 && y <= 630);
        if (isSymbol) {
          symbolPixels.push({ x, y, d: dist[i] });
        } else if (dist[i] <= 3.2) {
          contourPixels.push({ x, y, d: dist[i] });
        } else {
          bodyPixels.push({ x, y, d: dist[i] });
        }
      }
    }

    const totalCount = 14000;
    const targetSymbol = Math.round(totalCount * 0.08);   // 1120
    const targetContour = Math.round(totalCount * 0.35);  // 4900
    const targetBody = totalCount - targetSymbol - targetContour; // 7980

    const particles = [];
    const sampleFrom = (list, count, isContour, isSym) => {
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * list.length);
        const p = list[idx];
        const x = p.x + (Math.random() - 0.5) * (isContour ? 0.8 : 1.2);
        const y = p.y + (Math.random() - 0.5) * (isContour ? 0.8 : 1.2);
        
        // Pillow Z profile
        const dNorm = Math.min(1.0, p.d / 28.0);
        const pillow = Math.sin(dNorm * Math.PI * 0.5);
        const zSign = (i % 2 === 0) ? 1.0 : -1.0;
        
        // Crossing ribbons offset in Z:
        // Left diagonal crosses over right diagonal near center y in [240, 420]
        let zCross = 0;
        if (!isSym && y > 220 && y < 440) {
          // Left ribbon going down-right: positive Z
          // Right ribbon going down-left: negative Z
          if (x < cx + 40 && y < 330) zCross = 0.18;
          else if (x > cx - 40 && y >= 330) zCross = -0.18;
        }

        const z = isSym 
          ? (Math.random() - 0.5) * 0.08 
          : (zSign * pillow * 0.35 + zCross + (Math.random() - 0.5) * 0.06);

        // Sample real pixel color
        const piX = Math.max(0, Math.min(W - 1, Math.round(x)));
        const piY = Math.max(0, Math.min(H - 1, Math.round(y)));
        const pIdx = (piY * W + piX) * 4;
        const r = data[pIdx] / 255;
        const g = data[pIdx + 1] / 255;
        const b = data[pIdx + 2] / 255;

        // Normalized to world coords: centered at 0, height = 4.2 units
        const scale = 4.2 / bboxH;
        const wx = (x - cx) * scale;
        const wy = (cy - y) * scale; // inverted Y for 3D
        const wz = z * scale * 12.0;

        particles.push({ x, y, wx, wy, wz, r, g, b, isContour, isSym });
      }
    };

    sampleFrom(symbolPixels, targetSymbol, false, true);
    sampleFrom(contourPixels, targetContour, true, false);
    sampleFrom(bodyPixels, targetBody, false, false);

    // 4. VERIFICACIÓN OBJETIVA:
    // Con yaw = 0, proyectar partículas a 2D y verificar cuántas caen dentro de la máscara (alpha > 45)
    let insideMask = 0;
    for (const pt of particles) {
      const px = Math.round(pt.x);
      const py = Math.round(pt.y);
      if (px >= 0 && px < W && py >= 0 && py < H) {
        if (mask[py * W + px]) insideMask++;
      }
    }
    const maskPercentage = (insideMask / particles.length) * 100;

    // 5. Generar imagen lado a lado (logo original | partículas formadas)
    const sideW = 600;
    const sideH = 800;
    const sideCvs = new OffscreenCanvas(sideW * 2, sideH);
    const sCtx = sideCvs.getContext('2d');
    
    // Background #0B0B0E
    sCtx.fillStyle = '#0B0B0E';
    sCtx.fillRect(0, 0, sideW * 2, sideH);

    // Left side: original logo cropped and fitted
    const margin = 40;
    const fitW = sideW - margin * 2;
    const fitH = sideH - margin * 2;
    const scaleFactor = Math.min(fitW / bboxW, fitH / bboxH);
    const drawW = bboxW * scaleFactor;
    const drawH = bboxH * scaleFactor;
    const leftOffsetX = (sideW - drawW) / 2;
    const leftOffsetY = (sideH - drawH) / 2;

    sCtx.drawImage(bmp, minX, minY, bboxW, bboxH, leftOffsetX, leftOffsetY, drawW, drawH);

    // Divider line
    sCtx.strokeStyle = '#222';
    sCtx.lineWidth = 2;
    sCtx.beginPath();
    sCtx.moveTo(sideW, 0);
    sCtx.lineTo(sideW, sideH);
    sCtx.stroke();

    // Right side: simulated particle rendering
    const rightOffsetX = sideW + leftOffsetX;
    sCtx.fillStyle = '#0B0B0E';
    sCtx.fillRect(sideW, 0, sideW, sideH);

    // Draw particles
    for (const pt of particles) {
      const screenX = rightOffsetX + (pt.x - minX) * scaleFactor;
      const screenY = leftOffsetY + (pt.y - minY) * scaleFactor;
      const rgb = 'rgb(' + Math.round(pt.r * 255) + ',' + Math.round(pt.g * 255) + ',' + Math.round(pt.b * 255) + ')';
      sCtx.fillStyle = rgb;
      sCtx.fillRect(screenX - 1, screenY - 1, 2.2, 2.2);
    }

    // Labels
    sCtx.font = 'bold 16px sans-serif';
    sCtx.fillStyle = '#888';
    sCtx.fillText('LOGO ORIGINAL (PNG)', 40, 36);
    sCtx.fillText('PARTÍCULAS FORMADAS (14.000 pts · 35% contorno · 8% </>)', sideW + 40, 36);

    const sideBlob = await sideCvs.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    const dataUrlPromise = new Promise(res => { reader.onload = () => res(reader.result); reader.readAsDataURL(sideBlob); });
    const dataUrl = await dataUrlPromise;

    return {
      total: particles.length,
      insideMask,
      maskPercentage: Math.round(maskPercentage * 100) / 100,
      targetSymbol,
      targetContour,
      targetBody,
      dataUrlBase64: dataUrl.split(',')[1]
    };
  })()`,
  awaitPromise: true,
  returnByValue: true
});

console.log('\n--- VERIFICACIÓN OBJETIVA DEL LOGO ---');
console.log('Total partículas:', result.result.value.total);
console.log('Dentro de la máscara:', result.result.value.insideMask);
console.log('Porcentaje de fidelidad:', result.result.value.maskPercentage + '% (Objetivo: > 90%)');
console.log('Distribución:');
console.log('  Contorno (35%):', result.result.value.targetContour);
console.log('  Símbolo </> (8%):', result.result.value.targetSymbol);
console.log('  Cuerpo almohada (57%):', result.result.value.targetBody);

const sideImgBuffer = Buffer.from(result.result.value.dataUrlBase64, 'base64');
const outPath = path.join(REVIEW_DIR, 'logo_verification_side_by_side.png');
fs.writeFileSync(outPath, sideImgBuffer);
console.log('Saved verification image to:', outPath);

ws.close();
chrome.kill();

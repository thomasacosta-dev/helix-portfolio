const random = (seed) => {
	const value = Math.sin(seed * 12.9898) * 43758.5453;
	return value - Math.floor(value);
};

const createLogo3D = async (count, emblemUrl, depth = 0.5) => {
	try {
		const response = await fetch(emblemUrl);
		const bitmap = await createImageBitmap(await response.blob());
		const W = bitmap.width;
		const H = bitmap.height;
		const canvas = new OffscreenCanvas(W, H);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(bitmap, 0, 0);
		const data = ctx.getImageData(0, 0, W, H).data;

		// 1. Mask and Bounding Box
		let minX = W, maxX = 0, minY = H, maxY = 0;
		const mask = new Uint8Array(W * H);
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const idx = y * W + x;
				if (data[idx * 4 + 3] > 45) {
					mask[idx] = 1;
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
				}
			}
		}

		const bboxH = Math.max(maxY - minY + 1, 1);
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;

		// 2. Chamfer Distance Transform (2 passes)
		const dist = new Float32Array(W * H);
		const INF = 99999;
		for (let i = 0; i < W * H; i++) dist[i] = mask[i] ? INF : 0;

		for (let y = 1; y < H - 1; y++) {
			for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				if (mask[i]) {
					dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414, dist[i - W + 1] + 1.414);
				}
			}
		}

		for (let y = H - 2; y >= 1; y--) {
			for (let x = W - 2; x >= 1; x--) {
				const i = y * W + x;
				if (mask[i]) {
					dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414, dist[i + W - 1] + 1.414);
				}
			}
		}

		// 3. Classify pixels: 8% symbol </>, 35% contour, 57% body
		const symbolPixels = [];
		const contourPixels = [];
		const bodyPixels = [];

		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				const i = y * W + x;
				if (!mask[i]) continue;

				// Code symbol </> is located in cavity x: [428, 600], y: [490, 630]
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

		const targetSymbol = Math.round(count * 0.08);
		const targetContour = Math.round(count * 0.35);
		const targetBody = count - targetSymbol - targetContour;

		const logo = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);
		let pIndex = 0;

		// Normalized scale: logo height = 4.2 units (occupies ~75% of hero height)
		const scale = 4.2 / bboxH;

		const sampleGroup = (list, groupCount, isContour, isSym) => {
			if (!list.length) return;
			for (let i = 0; i < groupCount; i++) {
				const seed = pIndex + 1;
				const rVal = random(seed);
				const pix = list[Math.floor(rVal * list.length)];
				const jitterX = (random(seed + 11) - 0.5) * (isContour ? 0.75 : 1.25);
				const jitterY = (random(seed + 19) - 0.5) * (isContour ? 0.75 : 1.25);
				const x = pix.x + jitterX;
				const y = pix.y + jitterY;

				// Pillow effect in Z
				const dNorm = Math.min(1.0, pix.d / 28.0);
				const pillow = Math.sin(dNorm * Math.PI * 0.5);
				const zSign = (i % 2 === 0) ? 1.0 : -1.0;

				// Crossing ribbons offset in Z
				let zCross = 0;
				if (!isSym && y > 220 && y < 440) {
					if (x < cx + 40 && y < 330) zCross = depth * 0.42;
					else if (x > cx - 40 && y >= 330) zCross = -depth * 0.42;
				}

				const z = isSym
					? (random(seed + 27) - 0.5) * 0.08
					: (zSign * (depth * 0.5) * (0.58 + pillow * 0.42) + zCross + (random(seed + 27) - 0.5) * depth * 0.08);

				// Sample real pixel RGB from emblem PNG
				const piX = Math.max(0, Math.min(W - 1, Math.round(x)));
				const piY = Math.max(0, Math.min(H - 1, Math.round(y)));
				const dataIdx = (piY * W + piX) * 4;
				const r = data[dataIdx] / 255;
				const g = data[dataIdx + 1] / 255;
				const b = data[dataIdx + 2] / 255;

				// World coordinates: centered at (0, 0, 0)
				const wx = (x - cx) * scale;
				const wy = (cy - y) * scale;
				const wz = z;

				logo[pIndex * 3]     = wx;
				logo[pIndex * 3 + 1] = wy;
				logo[pIndex * 3 + 2] = wz;

				colors[pIndex * 3]     = r;
				colors[pIndex * 3 + 1] = g;
				colors[pIndex * 3 + 2] = b;

				pIndex++;
			}
		};

		sampleGroup(symbolPixels, targetSymbol, false, true);
		sampleGroup(contourPixels, targetContour, true, false);
		sampleGroup(bodyPixels, targetBody, false, false);

		return { logo, colors };
	} catch (e) {
		const logo = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);
		return { logo, colors };
	}
};

self.onmessage = async ({ data: { count, emblemUrl, depth } }) => {
	const start = new Float32Array(count * 3);
	const randomValues = new Float32Array(count);

	for (let index = 0; index < count; index += 1) {
		const seed = index + 1;
		const theta = random(seed) * Math.PI * 2;
		const phi = Math.acos(2 * random(seed + 2) - 1);
		const radius = 2.4 + random(seed + 3) * 2.2;
		start[index * 3]     = Math.sin(phi) * Math.cos(theta) * radius;
		start[index * 3 + 1] = Math.cos(phi) * radius;
		start[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
		randomValues[index]  = random(seed + 4);
	}

	const { logo, colors } = await createLogo3D(count, emblemUrl, depth);

	self.postMessage(
		{ start, logo, random: randomValues, color: colors },
		[start.buffer, logo.buffer, randomValues.buffer, colors.buffer]
	);
};

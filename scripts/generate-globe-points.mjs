import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import land from 'world-atlas/land-110m.json' with { type: 'json' };

const sampleCount = 60000;
const points = [];
const landFeature = feature(land, land.objects.land);
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const frontRotation = 0.28;
const frontCos = Math.cos(frontRotation);
const frontSin = Math.sin(frontRotation);

for (let i = 0; i < sampleCount; i += 1) {
	const y = 1 - (i / (sampleCount - 1)) * 2;
	const radius = Math.sqrt(1 - y * y);
	const theta = goldenAngle * i;
	const x = Math.cos(theta) * radius;
	const z = Math.sin(theta) * radius;
	const lon = Math.atan2(z, x) * 180 / Math.PI;
	const lat = Math.asin(y) * 180 / Math.PI;
	if (geoContains(landFeature, [lon, lat])) {
		points.push(frontCos * x + frontSin * z, y, -frontSin * x + frontCos * z);
	}
}

const output = resolve('public/data');
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'globe-points.bin'), Buffer.from(new Float32Array(points).buffer));

const svgPoints = [];
for (let i = 0; i < points.length; i += 3) {
	const x = 280 + points[i] * 230;
	const y = 280 - points[i + 1] * 230;
	const opacity = points[i + 2] > 0 ? 0.82 : 0.25;
	svgPoints.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="0.72" opacity="${opacity}"/>`);
}
await writeFile(resolve(output, 'globe-static.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560"><g fill="#ece8e1">${svgPoints.join('')}</g></svg>`);
console.log(`Generated ${points.length / 3} land points.`);

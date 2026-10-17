self.onmessage = ({ data }) => {
	const { positions, count, origin } = data;
	const targets = new Float32Array(positions);
	const starts = new Float32Array(count * 3);
	const randoms = new Float32Array(count);
	const distances = new Float32Array(count);
	for (let i = 0; i < count; i += 1) {
		const x = targets[i * 3], y = targets[i * 3 + 1], z = targets[i * 3 + 2];
		const random = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
		const random2 = Math.abs((Math.sin(i * 78.233) * 24634.6345) % 1);
		const random3 = Math.abs((Math.sin(i * 39.425) * 56445.2341) % 1);
		const azimuth = random * Math.PI * 2;
		const elevation = Math.asin(random2 * 2 - 1);
		const radius = 1.45 + random3 * 1.25;
		const horizontal = Math.cos(elevation);
		starts[i * 3] = Math.cos(azimuth) * horizontal * radius;
		starts[i * 3 + 1] = Math.sin(elevation) * radius;
		starts[i * 3 + 2] = Math.sin(azimuth) * horizontal * radius;
		const length = Math.hypot(x, y, z) || 1;
		const dot = Math.max(-1, Math.min(1, (x * origin[0] + y * origin[1] + z * origin[2]) / length));
		randoms[i] = random;
		distances[i] = Math.acos(dot) / Math.PI;
	}
	self.postMessage({ starts, randoms, distances }, [starts.buffer, randoms.buffer, distances.buffer]);
};

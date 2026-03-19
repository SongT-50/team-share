const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

const BLUE = "#2563eb";
const WHITE = "#ffffff";

function makeIcon(size, maskable = false) {
  const half = size / 2;

  if (maskable) {
    // Maskable: full blue background, content within 80% safe zone
    const safeRadius = size * 0.4; // 80% diameter = 40% radius
    const fontSize = size * 0.28;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BLUE}"/>
  <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="central"
    font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="${WHITE}" letter-spacing="${size * 0.01}">TS</text>
</svg>`;
  }

  // Regular: circular icon
  const radius = half;
  const fontSize = size * 0.35;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${half}" cy="${half}" r="${radius}" fill="${BLUE}"/>
  <text x="${half}" y="${half}" text-anchor="middle" dominant-baseline="central"
    font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="${WHITE}" letter-spacing="${size * 0.01}">TS</text>
</svg>`;
}

const icons = [
  { name: "icon-192.svg", size: 192, maskable: false },
  { name: "icon-512.svg", size: 512, maskable: false },
  { name: "icon-maskable-192.svg", size: 192, maskable: true },
  { name: "icon-maskable-512.svg", size: 512, maskable: true },
  { name: "apple-touch-icon.svg", size: 180, maskable: false },
  { name: "favicon.svg", size: 32, maskable: false },
];

for (const icon of icons) {
  const svg = makeIcon(icon.size, icon.maskable);
  const filePath = path.join(publicDir, icon.name);
  fs.writeFileSync(filePath, svg, "utf-8");
  console.log(`Created ${icon.name} (${icon.size}x${icon.size}${icon.maskable ? ", maskable" : ""})`);
}

console.log("\nAll icons generated in public/");

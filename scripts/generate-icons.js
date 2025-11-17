// Simple icon generator for PWA
// This creates basic placeholder icons with the PW logo
// For production, replace with professionally designed icons

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG template for each size
const createSVG = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0; // 10% padding for maskable icons
  const contentSize = size - (padding * 2);
  const fontSize = contentSize * 0.4;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <rect x="${padding}" y="${padding}" width="${contentSize}" height="${contentSize}" fill="#fbbf24" rx="${contentSize * 0.1}"/>
  <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="#000000" 
        text-anchor="middle">PW</text>
</svg>`;
};

// Generate regular icons
sizes.forEach(size => {
  const svg = createSVG(size, false);
  const filename = `icon-${size}x${size}.png`;
  
  // For now, save as SVG (convert to PNG in production with a proper tool)
  fs.writeFileSync(
    path.join(iconsDir, filename.replace('.png', '.svg')),
    svg
  );
  
  console.log(`Created ${filename.replace('.png', '.svg')}`);
});

// Generate maskable icons
[192, 512].forEach(size => {
  const svg = createSVG(size, true);
  const filename = `icon-${size}x${size}-maskable.svg`;
  
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

// Create apple-touch-icon
const appleTouchIcon = createSVG(180, false);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log('Created apple-touch-icon.svg');

// Create favicon
const favicon = createSVG(32, false);
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), favicon);
console.log('Created favicon.svg');

console.log('\n✅ Icon generation complete!');
console.log('Note: SVG files created. For production, convert to PNG using a tool like sharp or imagemagick.');
console.log('Example: npx sharp -i icon.svg -o icon.png');




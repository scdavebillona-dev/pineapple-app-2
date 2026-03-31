#!/usr/bin/env node

/**
 * Icon Generator for PineAI
 * Generates SVG icons with grass icon design to match login and splash screens
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  primary: '#EA580C',
  primaryMuted: 'rgba(234, 88, 12, 0.15)',
};

function generateSVG(size = 1024) {
  const center = size / 2;
  const circleRadius = size * 0.35;
  const bladeWidth = size * 0.04;
  const bladeHeight = size * 0.12;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  
  <!-- Circle background (muted) -->
  <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="${COLORS.primaryMuted}"/>
  
  <!-- Circle border -->
  <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="none" stroke="${COLORS.primary}" stroke-width="${size * 0.04}"/>
  
  <!-- Left grass blade -->
  <g transform="translate(${center - size * 0.08}, ${center}) rotate(-30)">
    <rect x="${-bladeWidth / 2}" y="0" width="${bladeWidth}" height="${bladeHeight}" fill="${COLORS.primary}" rx="${bladeWidth / 2}"/>
  </g>
  
  <!-- Center grass blade -->
  <rect x="${center - bladeWidth / 2}" y="${center - bladeHeight * 0.6}" width="${bladeWidth}" height="${bladeHeight}" fill="${COLORS.primary}" rx="${bladeWidth / 2}"/>
  
  <!-- Right grass blade -->
  <g transform="translate(${center + size * 0.08}, ${center}) rotate(30)">
    <rect x="${-bladeWidth / 2}" y="0" width="${bladeWidth}" height="${bladeHeight}" fill="${COLORS.primary}" rx="${bladeWidth / 2}"/>
  </g>
</svg>`;
}

function generateMonochromeSVG(size = 1024) {
  const center = size / 2;
  const circleRadius = size * 0.35;
  const bladeWidth = size * 0.04;
  const bladeHeight = size * 0.12;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  
  <!-- Circle background (muted) -->
  <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="rgba(0, 0, 0, 0.1)"/>
  
  <!-- Circle border -->
  <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="none" stroke="#000000" stroke-width="${size * 0.04}"/>
  
  <!-- Left grass blade -->
  <g transform="translate(${center - size * 0.08}, ${center}) rotate(-30)">
    <rect x="${-bladeWidth / 2}" y="0" width="${bladeWidth}" height="${bladeHeight}" fill="#000000" rx="${bladeWidth / 2}"/>
  </g>
  
  <!-- Center grass blade -->
  <rect x="${center - bladeWidth / 2}" y="${center - bladeHeight * 0.6}" width="${bladeWidth}" height="${bladeHeight}" fill="#000000" rx="${bladeWidth / 2}"/>
  
  <!-- Right grass blade -->
  <g transform="translate(${center + size * 0.08}, ${center}) rotate(30)">
    <rect x="${-bladeWidth / 2}" y="0" width="${bladeWidth}" height="${bladeHeight}" fill="#000000" rx="${bladeWidth / 2}"/>
  </g>
</svg>`;
}

function generateBackgroundSVG(size = 1080) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
</svg>`;
}

function saveSVG(content, filename) {
  const filepath = path.join(__dirname, '..', 'assets', 'images', filename.replace('.png', '.svg'));
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✓ Generated ${filename} (SVG template)`);
}

function main() {
  try {
    console.log('🎨 Generating PineAI icon SVG templates...\n');

    // Generate color icon SVGs
    saveSVG(generateSVG(1024), 'icon.png');
    saveSVG(generateSVG(1080), 'android-icon-foreground.png');
    saveSVG(generateBackgroundSVG(1080), 'android-icon-background.png');
    saveSVG(generateMonochromeSVG(1080), 'android-icon-monochrome.png');
    saveSVG(generateSVG(200), 'splash-icon.png');
    saveSVG(generateSVG(192), 'favicon.png');

    console.log('\n✅ SVG templates generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Convert SVG files to PNG using an online tool (e.g., CloudConvert, Convertio)');
    console.log('2. Or use a tool like "svgexport" or ImageMagick locally');
    console.log('3. Replace the existing PNG files in assets/images/');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();

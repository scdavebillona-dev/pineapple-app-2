#!/usr/bin/env node

/**
 * Simple SVG to PNG Converter
 * Uses available npm packages or provides online conversion links
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ICON_CONFIGS = [
  { svg: 'icon.svg', png: 'icon.png', size: 1024 },
  { svg: 'android-icon-foreground.svg', png: 'android-icon-foreground.png', size: 1080 },
  { svg: 'android-icon-background.svg', png: 'android-icon-background.png', size: 1080 },
  { svg: 'android-icon-monochrome.svg', png: 'android-icon-monochrome.png', size: 1080 },
  { svg: 'splash-icon.svg', png: 'splash-icon.png', size: 200 },
  { svg: 'favicon.svg', png: 'favicon.png', size: 192 },
];

const assetsDir = path.join(__dirname, '..', 'assets', 'images');

function showConversionGuide() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║         PineAI Icon Converter - Quick Setup Guide                 ║
╚═══════════════════════════════════════════════════════════════════╝

✅ Your SVG icon templates have been generated in:
   📁 assets/images/

🎨 Conversion Options (Choose One):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: EASIEST - Online Converter (No Installation)
─────────────────────────────────────
1. Visit: https://cloudconvert.com/svg-to-png
2. Upload each SVG file from: assets/images/
3. Set output to PNG with the specified size
4. Download and replace the existing PNG files

Files to convert:
  • icon.svg → 1024×1024 → icon.png
  • android-icon-foreground.svg → 1080×1080 → android-icon-foreground.png
  • android-icon-background.svg → 1080×1080 → android-icon-background.png
  • android-icon-monochrome.svg → 1080×1080 → android-icon-monochrome.png
  • splash-icon.svg → 200×200 → splash-icon.png
  • favicon.svg → 192×192 → favicon.png

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 2: ImageMagick (Command Line)
──────────────────────────────────────
1. Install ImageMagick: https://imagemagick.org/script/download.php
2. Run: .\\convert-icons.bat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 3: Favorite Image Editor
────────────────────────────────
1. Open each SVG in Photoshop, GIMP, or Figma
2. Export as PNG with the specified dimensions
3. Save to: assets/images/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 After conversion:
   ✓ Your app will display the grass icon across all platforms
   ✓ Login screen will match splash screen
   ✓ APK will use the same icon design
   ✓ Consistent branding throughout

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// Check if any libraries are available for automatic conversion
async function tryAutomaticConversion() {
  // Try svgexport
  try {
    const { execSync } = require('child_process');
    console.log('Attempting automatic conversion with svgexport...\n');
    
    ICON_CONFIGS.forEach(config => {
      const svgPath = path.join(assetsDir, config.svg);
      const pngPath = path.join(assetsDir, config.png);
      
      if (fs.existsSync(svgPath)) {
        try {
          execSync(`svgexport "${svgPath}" "${pngPath}" ${config.size}:${config.size}`);
          console.log(`✓ ${config.png}`);
        } catch (e) {
          throw new Error('svgexport failed');
        }
      }
    });
    
    console.log('\n✅ Automatic conversion successful!');
    return true;
  } catch (e) {
    // Auto-conversion failed, show manual guide
    return false;
  }
}

// Main
async function main() {
  console.log('🎨 PineAI Icon Converter\n');
  
  // Try automatic conversion first
  const success = await tryAutomaticConversion();
  
  if (!success) {
    // Show manual conversion guide
    showConversionGuide();
  }
}

main();

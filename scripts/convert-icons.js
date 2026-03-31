#!/usr/bin/env node

/**
 * SVG to PNG Converter using Puppeteer
 * Converts the generated SVG icon templates to PNG
 */

const fs = require('fs');
const path = require('path');

async function convertSVGToPNG() {
  try {
    const puppeteer = require('puppeteer');
    
    const iconConfigs = [
      { svgName: 'icon.svg', pngName: 'icon.png', size: 1024 },
      { svgName: 'android-icon-foreground.svg', pngName: 'android-icon-foreground.png', size: 1080 },
      { svgName: 'android-icon-background.svg', pngName: 'android-icon-background.png', size: 1080 },
      { svgName: 'android-icon-monochrome.svg', pngName: 'android-icon-monochrome.png', size: 1080 },
      { svgName: 'splash-icon.svg', pngName: 'splash-icon.png', size: 200 },
      { svgName: 'favicon.svg', pngName: 'favicon.png', size: 192 },
    ];

    console.log('🔄 Converting SVG to PNG...\n');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const config of iconConfigs) {
      const svgPath = path.join(__dirname, '..', 'assets', 'images', config.svgName);
      const pngPath = path.join(__dirname, '..', 'assets', 'images', config.pngName);

      if (!fs.existsSync(svgPath)) {
        console.log(`⚠️  Skipping ${config.svgName} - file not found`);
        continue;
      }

      const page = await browser.newPage();
      await page.setViewport({ width: config.size, height: config.size, deviceScaleFactor: 1 });

      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              svg { display: block; }
            </style>
          </head>
          <body>
            ${svgContent}
          </body>
        </html>
      `;

      await page.setContent(htmlContent);
      await page.screenshot({ path: pngPath, omitBackground: false });
      await page.close();

      console.log(`✓ Generated ${config.pngName}`);
    }

    await browser.close();
    console.log('\n✅ All PNG icons generated successfully!');
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n📝 Puppeteer not found. Using alternative method...');
      console.log('Install with: npm install --save-dev puppeteer');
    }
    
    process.exit(1);
  }
}

convertSVGToPNG();

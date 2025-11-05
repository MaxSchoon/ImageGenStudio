const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const sourceImage = path.join(iconsDir, 'favicon.png');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  try {
    // iOS Apple Touch Icons (square, no padding)
    const appleTouchSizes = [
      { size: 180, name: 'apple-touch-icon.png' }, // iPhone Pro Max
      { size: 152, name: 'apple-touch-icon-152x152.png' },
      { size: 144, name: 'apple-touch-icon-144x144.png' },
      { size: 120, name: 'apple-touch-icon-120x120.png' },
      { size: 114, name: 'apple-touch-icon-114x114.png' },
      { size: 76, name: 'apple-touch-icon-76x76.png' },
      { size: 72, name: 'apple-touch-icon-72x72.png' },
      { size: 60, name: 'apple-touch-icon-60x60.png' },
      { size: 57, name: 'apple-touch-icon-57x57.png' },
    ];

    // Android Chrome icons
    const androidSizes = [
      { size: 192, name: 'android-chrome-192x192.png' },
      { size: 512, name: 'android-chrome-512x512.png' },
    ];

    // Favicon sizes for favicon.ico
    const faviconSizes = [16, 32, 48];

    console.log('Generating icons from:', sourceImage);

    // Generate Apple Touch Icons
    console.log('Generating Apple Touch Icons...');
    for (const { size, name } of appleTouchSizes) {
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(iconsDir, name));
      console.log(`✓ Generated ${name}`);
    }

    // Generate Android Chrome Icons
    console.log('Generating Android Chrome Icons...');
    for (const { size, name } of androidSizes) {
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(iconsDir, name));
      console.log(`✓ Generated ${name}`);
    }

    // Generate favicon sizes
    console.log('Generating favicon sizes...');
    const faviconBuffers = [];
    for (const size of faviconSizes) {
      const buffer = await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      faviconBuffers.push(buffer);
      
      // Also save as individual PNG files
      await sharp(buffer)
        .toFile(path.join(iconsDir, `favicon-${size}x${size}.png`));
      console.log(`✓ Generated favicon-${size}x${size}.png`);
    }

    // Create proper favicon.ico with multiple sizes
    console.log('Generating favicon.ico...');
    const icoBuffer = await toIco(faviconBuffers);
    const icoPath = path.join(iconsDir, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('✓ Generated favicon.ico in icons folder');
    
    // Also copy to root for maximum browser compatibility
    fs.copyFileSync(icoPath, path.join(publicDir, 'favicon.ico'));
    console.log('✓ Copied favicon.ico to public root for browser compatibility');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();


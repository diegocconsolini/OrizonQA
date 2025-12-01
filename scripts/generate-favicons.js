/**
 * Generate optimized favicon files from source image
 * Requires: npm install sharp --save-dev
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImage = path.join(__dirname, '../public/logos/orizon-icon-blue-darkv2.png');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('🎨 Generating optimized favicons...\n');

  try {
    // Read source image info
    const metadata = await sharp(sourceImage).metadata();
    console.log(`Source image: ${metadata.width}x${metadata.height} (${metadata.format})`);

    // Generate favicon.ico (32x32 for best browser support)
    await sharp(sourceImage)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    console.log('✓ favicon-32x32.png created');

    // Generate 16x16 favicon
    await sharp(sourceImage)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    console.log('✓ favicon-16x16.png created');

    // Generate 180x180 for Apple Touch Icon
    await sharp(sourceImage)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png created');

    // Generate 192x192 for Android
    await sharp(sourceImage)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'android-chrome-192x192.png'));
    console.log('✓ android-chrome-192x192.png created');

    // Generate 512x512 for Android
    await sharp(sourceImage)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'android-chrome-512x512.png'));
    console.log('✓ android-chrome-512x512.png created');

    // Generate optimized favicon.ico using 32x32
    // Note: .ico format not directly supported by sharp, will use PNG as fallback
    await sharp(sourceImage)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat('png')
      .toFile(path.join(outputDir, 'favicon.png'));
    console.log('✓ favicon.png created (use as favicon.ico alternative)');

    console.log('\n✅ All favicons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update app/layout.js with the new favicon paths');
    console.log('2. Consider using https://realfavicongenerator.net/ for .ico format');

  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();

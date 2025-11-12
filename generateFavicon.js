import sharp from 'sharp';
import fs from 'fs';

async function generateFavicon() {
  const svgContent = `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#F4C542"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Press Start 2P', cursive" font-size="30" fill="#4B2E2E">SQ</text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svgContent))
      .resize(64, 64)
      .png()
      .toFile('favicon.ico');
    console.log('Favicon generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon();

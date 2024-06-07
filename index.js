const fs = require('fs');
const path = require('path');
const gifFrames = require('gif-frames');
const sharp = require('sharp');

// Create directory if it does not exist
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Convert ReadableStream to Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Convert GIF to PNG frames
async function convertGifToPngFrames(filePath, outputDir) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const outputFilePath = path.join(outputDir, fileName);

  createDirIfNotExists(outputFilePath);

  try {
    const frameData = await gifFrames({ url: filePath, frames: 'all', outputType: 'png' });

    for (let i = 0; i < frameData.length; i++) {
      const frame = frameData[i];
      const frameOutputPath = path.join(outputFilePath, `${i + 1}.png`);

      // Convert frame data to Buffer
      const buffer = await streamToBuffer(frame.getImage());

      await sharp(buffer).toFile(frameOutputPath);

      console.log(`Saved frame ${i + 1} to ${frameOutputPath}`);
    }

    console.log(`Finished converting ${fileName}.gif`);
  } catch (error) {
    console.error(`Error converting ${fileName}.gif:`, error);
  }
}

// Recursively get all GIF files in the directory
function getGifFilesRecursively(dir) {
  let results = [];

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getGifFilesRecursively(filePath));
    } else if (path.extname(file).toLowerCase() === '.gif') {
      results.push(filePath);
    }
  });

  return results;
}

// Main function
async function main() {
  const inputDir = path.join(__dirname, 'input');
  const outputDir = path.join(__dirname, 'output');

  createDirIfNotExists(inputDir);
  createDirIfNotExists(outputDir);

  const gifFiles = getGifFilesRecursively(inputDir);

  if (gifFiles.length === 0) {
    console.log('No GIF files found in the input directory.');
    return;
  }

  for (const gifFile of gifFiles) {
    const relativePath = path.relative(inputDir, gifFile);
    const outputFilePath = path.join(outputDir, path.dirname(relativePath));
    createDirIfNotExists(outputFilePath);
    await convertGifToPngFrames(gifFile, outputFilePath);
  }
}

main().catch(console.error);

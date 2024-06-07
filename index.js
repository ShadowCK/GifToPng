const fs = require('fs');
const path = require('path');
const gifFrames = require('gif-frames');
const sharp = require('sharp');

// 创建文件夹（如果不存在）
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 将 ReadableStream 转换为 Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// 转换 GIF 为 PNG 帧
async function convertGifToPngFrames(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const outputDir = path.join(__dirname, fileName);

  createDirIfNotExists(outputDir);

  try {
    const frameData = await gifFrames({ url: filePath, frames: 'all', outputType: 'png' });

    for (let i = 0; i < frameData.length; i++) {
      const frame = frameData[i];
      const outputFilePath = path.join(outputDir, `${i + 1}.png`);

      // 将帧数据转换为 Buffer
      const buffer = await streamToBuffer(frame.getImage());

      await sharp(buffer).toFile(outputFilePath);

      console.log(`Saved frame ${i + 1} to ${outputFilePath}`);
    }

    console.log(`Finished converting ${fileName}.gif`);
  } catch (error) {
    console.error(`Error converting ${fileName}.gif:`, error);
  }
}

// 读取当前目录下的所有 GIF 文件
function getGifFiles(dir) {
  return fs.readdirSync(dir).filter((file) => path.extname(file).toLowerCase() === '.gif');
}

// 主函数
async function main() {
  const gifFiles = getGifFiles(__dirname);

  for (const gifFile of gifFiles) {
    await convertGifToPngFrames(path.join(__dirname, gifFile));
  }
}

main().catch(console.error);

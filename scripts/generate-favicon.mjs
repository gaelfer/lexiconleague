import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "../src/app/icon.svg");
const icoPath = join(__dirname, "../src/app/favicon.ico");

const svgBuffer = readFileSync(svgPath);
const sizes = [16, 32, 48];

const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer()
  )
);

const icoBuffer = await pngToIco(pngBuffers);
writeFileSync(icoPath, icoBuffer);
console.log(`Generated ${icoPath}`);

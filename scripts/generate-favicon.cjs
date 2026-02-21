const sharp = require("sharp");
const { default: pngToIco } = require("png-to-ico");
const { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } = require("fs");
const { join } = require("path");
const { tmpdir } = require("os");

const svgPath = join(__dirname, "../src/app/icon.svg");
const icoPath = join(__dirname, "../src/app/favicon.ico");
const svgBuffer = readFileSync(svgPath);
const sizes = [16, 32, 48];

const tmpDir = mkdtempSync(join(tmpdir(), "favicon-"));
const pngPaths = sizes.map((s) => join(tmpDir, `icon-${s}.png`));

Promise.all(
  sizes.map((size, i) =>
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPaths[i])
  )
)
  .then(() => pngToIco(pngPaths))
  .then((icoBuffer) => {
    writeFileSync(icoPath, icoBuffer);
    console.log(`Generated ${icoPath}`);
  })
  .finally(() => {
    pngPaths.forEach((p) => { try { unlinkSync(p); } catch (_) {} });
    try { rmdirSync(tmpDir); } catch (_) {}
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

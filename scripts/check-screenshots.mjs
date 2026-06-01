#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const screenshotsDir = path.join(root, "docs", "screenshots");

const expectedFiles = [
  "dashboard.svg",
  "transactions.svg",
  "budgets.svg",
  "reports.svg",
  "recurring.svg",
];

const recommendedWidth = 1600;
const recommendedHeight = 900;

function fail(message) {
  console.error(`\n[check:screenshots] ${message}`);
  process.exit(1);
}

function parseSvgSize(content, fileName) {
  const widthMatch = content.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = content.match(/\bheight\s*=\s*"(\d+)"/i);
  const viewBoxMatch = content.match(/\bviewBox\s*=\s*"([^"]+)"/i);

  if (widthMatch && heightMatch) {
    return {
      width: Number(widthMatch[1]),
      height: Number(heightMatch[1]),
      source: "width/height",
    };
  }

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    if (
      parts.length === 4 &&
      Number.isFinite(parts[2]) &&
      Number.isFinite(parts[3])
    ) {
      return {
        width: parts[2],
        height: parts[3],
        source: "viewBox",
      };
    }
  }

  fail(`${fileName} is missing parseable width/height or viewBox.`);
}

function getPngSize(fileBuffer, fileName) {
  const signature = fileBuffer.subarray(0, 8);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(pngSig)) {
    fail(`${fileName} is not a valid PNG file.`);
  }

  // IHDR width/height are big-endian uint32 at bytes 16..23
  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  return { width, height, source: "png-header" };
}

function getSize(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".svg") {
    const content = fs.readFileSync(filePath, "utf8");
    return parseSvgSize(content, fileName);
  }

  if (ext === ".png") {
    const buffer = fs.readFileSync(filePath);
    return getPngSize(buffer, fileName);
  }

  fail(`${fileName} must be .svg or .png.`);
}

if (!fs.existsSync(screenshotsDir)) {
  fail(`Screenshots folder not found: ${screenshotsDir}`);
}

const results = [];
let baseline = null;

for (const expected of expectedFiles) {
  const svgPath = path.join(screenshotsDir, expected);
  const pngPath = path.join(
    screenshotsDir,
    expected.replace(/\.svg$/i, ".png"),
  );

  let resolvedPath = null;
  let resolvedName = null;

  if (fs.existsSync(pngPath)) {
    resolvedPath = pngPath;
    resolvedName = path.basename(pngPath);
  } else if (fs.existsSync(svgPath)) {
    resolvedPath = svgPath;
    resolvedName = path.basename(svgPath);
  }

  if (!resolvedPath) {
    fail(
      `Missing screenshot: expected ${expected} or ${expected.replace(/\.svg$/i, ".png")}`,
    );
  }

  const size = getSize(resolvedPath, resolvedName);

  if (!baseline) {
    baseline = { width: size.width, height: size.height, name: resolvedName };
  } else if (size.width !== baseline.width || size.height !== baseline.height) {
    fail(
      `${resolvedName} is ${size.width}x${size.height}, but baseline ${baseline.name} is ${baseline.width}x${baseline.height}.`,
    );
  }

  results.push({ name: resolvedName, width: size.width, height: size.height });
}

console.log(
  "\n[check:screenshots] All screenshot files are present and consistent.",
);
for (const row of results) {
  console.log(`- ${row.name}: ${row.width}x${row.height}`);
}

if (
  baseline &&
  (baseline.width !== recommendedWidth || baseline.height !== recommendedHeight)
) {
  console.log(
    `\n[check:screenshots] Note: using ${baseline.width}x${baseline.height}. Recommended: ${recommendedWidth}x${recommendedHeight}.`,
  );
}

#!/usr/bin/env node
// Side-by-side contact sheet: reference on the left, render on the right, one row per frame.
//   node scripts/qa/compare-frames.mjs REF.mp4 OUT.mp4 out/qa/sheet.png 21 45 66 150 ...
// Frame numbers are 0-based and taken from the SAME index in both videos, so use videos with the
// same fps (the reference-matched compositions are). Rows run top to bottom in the order given and
// are tiled 3 pairs per row. Open the PNG and compare the pairs.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [ref, out, sheet, ...frameArgs] = process.argv.slice(2);
const frames = frameArgs.map(Number).filter((n) => Number.isInteger(n) && n >= 0);
if (!ref || !out || !sheet || frames.length === 0) {
  console.error("Usage: node scripts/qa/compare-frames.mjs REF.mp4 OUT.mp4 sheet.png frame [frame ...]");
  process.exit(1);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cmpf-"));
const grab = (video, frame, file) =>
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-i", video,
    "-vf", `select=eq(n\\,${frame}),scale=300:225`,
    "-frames:v", "1", file,
  ]);
const pairs = frames.map((f, i) => {
  const a = path.join(dir, `r${i}.png`);
  const b = path.join(dir, `o${i}.png`);
  const p = path.join(dir, `p${i}.png`);
  grab(ref, f, a);
  grab(out, f, b);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", a, "-i", b, "-filter_complex", "hstack", p]);
  return p;
});
const layout = pairs.map((_, i) => `${(i % 3) * 600}_${Math.floor(i / 3) * 225}`).join("|");
fs.mkdirSync(path.dirname(sheet), { recursive: true });
if (pairs.length === 1) {
  fs.copyFileSync(pairs[0], sheet);
} else {
  execFileSync("ffmpeg", [
    "-y", "-v", "error",
    ...pairs.flatMap((p) => ["-i", p]),
    "-filter_complex", `xstack=inputs=${pairs.length}:layout=${layout}`,
    sheet,
  ]);
}
console.log(`Wrote ${sheet}: ${frames.length} pairs (left = reference, right = render), frames ${frames.join(", ")}`);

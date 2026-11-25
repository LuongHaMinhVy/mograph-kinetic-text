#!/usr/bin/env node
// Motion per second, to see WHERE a render is dead compared with the reference.
//   node scripts/qa/motion-profile.mjs LABEL path.mp4 [seconds] [fps]
// Prints one number per second (mean frame-to-frame change, 0-255 scale) and the share of frames
// that are busy (>15), medium (6-15) and static (<=2).
import { execFileSync } from "node:child_process";

const [label = "video", path, secsArg = "30", fpsArg = "24"] = process.argv.slice(2);
if (!path) {
  console.error("Usage: node scripts/qa/motion-profile.mjs LABEL path.mp4 [seconds] [fps]");
  process.exit(1);
}
const FPS = Number(fpsArg);
const W = 96;
const H = 72;
const raw = execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", path, "-vf", `fps=${FPS},scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"],
  { maxBuffer: 1 << 30 }
);
const fb = W * H;
const n = Math.floor(raw.length / fb);
const m = new Float64Array(n);
for (let f = 1; f < n; f++) {
  let d = 0;
  for (let i = 0; i < fb; i++) d += Math.abs(raw[f * fb + i] - raw[(f - 1) * fb + i]);
  m[f] = d / fb;
}
const secs = Math.min(Number(secsArg), Math.floor(n / FPS));
const perSec = [];
for (let s = 0; s < secs; s++) {
  let a = 0;
  for (let f = s * FPS; f < (s + 1) * FPS; f++) a += m[f];
  perSec.push((a / FPS).toFixed(1));
}
const arr = [...m.slice(0, secs * FPS)];
const share = (pred) => ((arr.filter(pred).length / arr.length) * 100).toFixed(0) + "%";
console.log(label.padEnd(10), "per-sec:", perSec.join(" "));
console.log(
  " ".repeat(10),
  "mean",
  (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2),
  "| busy >15:",
  share((v) => v > 15),
  "| 6-15:",
  share((v) => v > 6 && v <= 15),
  "| static <=2:",
  share((v) => v <= 2)
);

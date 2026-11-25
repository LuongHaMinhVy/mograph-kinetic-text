#!/usr/bin/env node
// Rough, comparable numbers for how busy a video is. Run it on a reference and on your render.
//   node scripts/qa/motion-stats.mjs "REF=references/ref.mp4" "OUT=out/render.mp4" [--fps 24]
// Per video: coverMean/coverP90 (share of frame that is not background), motMean/motP90 (mean
// frame-to-frame change on a 0-255 scale), calmPct (frames that barely move), hardCutsPerSec.
// These are pixel statistics. They do NOT measure smoothness, legibility or sync: always look at
// frames too.
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const fpsIdx = args.indexOf("--fps");
const FPS = fpsIdx >= 0 ? Number(args[fpsIdx + 1]) : 24;
const jobs = args.filter((a, i) => a.includes("=") && i !== fpsIdx + 1);
const W = 96;
const H = 72;

function stats(path) {
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", path, "-vf", `fps=${FPS},scale=${W}:${H}:flags=area,format=rgb24`, "-f", "rawvideo", "-"],
    { maxBuffer: 1 << 30 }
  );
  const fb = W * H * 3;
  const n = Math.floor(raw.length / fb);
  const hist = new Map();
  for (let f = 0; f < n; f += 3) {
    for (let i = 0; i < W * H; i++) {
      const o = f * fb + i * 3;
      const k = ((raw[o] >> 4) << 8) | ((raw[o + 1] >> 4) << 4) | (raw[o + 2] >> 4);
      hist.set(k, (hist.get(k) || 0) + 1);
    }
  }
  const bg = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const br = ((bg >> 8) & 15) * 16 + 8;
  const bgG = ((bg >> 4) & 15) * 16 + 8;
  const bb = (bg & 15) * 16 + 8;
  const mot = [];
  const cov = [];
  for (let f = 0; f < n; f++) {
    let c = 0;
    let d = 0;
    for (let i = 0; i < W * H; i++) {
      const o = f * fb + i * 3;
      if (Math.abs(raw[o] - br) + Math.abs(raw[o + 1] - bgG) + Math.abs(raw[o + 2] - bb) > 90) c++;
      if (f > 0) {
        const q = o - fb;
        d += Math.abs(raw[o] - raw[q]) + Math.abs(raw[o + 1] - raw[q + 1]) + Math.abs(raw[o + 2] - raw[q + 2]);
      }
    }
    cov.push(c / (W * H));
    mot.push(d / (W * H * 3));
  }
  const pct = (a, q) => [...a].sort((x, y) => x - y)[Math.floor(q * (a.length - 1))];
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  let cuts = 0;
  for (let f = 2; f < n; f++) if (mot[f] > 8 && mot[f] > mot[f - 1] * 1.5) cuts++;
  const sec = n / FPS;
  return {
    sec: +sec.toFixed(1),
    coverMean: +(mean(cov) * 100).toFixed(1),
    coverP90: +(pct(cov, 0.9) * 100).toFixed(1),
    motMean: +mean(mot).toFixed(2),
    motP90: +pct(mot, 0.9).toFixed(2),
    calmPct: +((100 * mot.filter((x) => x < 0.3).length) / n).toFixed(0),
    hardCutsPerSec: +(cuts / sec).toFixed(2),
  };
}

if (jobs.length === 0) {
  console.error('Usage: node scripts/qa/motion-stats.mjs "LABEL=path.mp4" ... [--fps 24]');
  process.exit(1);
}
for (const job of jobs) {
  const [label, ...rest] = job.split("=");
  console.log(label.padEnd(16), JSON.stringify(stats(rest.join("="))));
}

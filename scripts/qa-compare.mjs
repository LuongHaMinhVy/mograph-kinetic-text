import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const REF_VIDEO = path.join(
  ROOT_DIR,
  "references",
  "_luntuyett.01_7640160161155386645.mp4"
);
const OUT_VIDEO = path.join(ROOT_DIR, "out", "hk1999-demo.mp4");
const QA_DIR = path.join(ROOT_DIR, "out", "qa");

function renderCompareStrip(startFrame, endFrame, outName) {
  const outputPath = path.join(QA_DIR, outName);
  const filter = [
    `[0:v]select='between(n,${startFrame},${endFrame})*not(mod(n-${startFrame},8))',setpts=N/TB,scale=240:180,drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='REF f=%{eif\\:${startFrame}+n*8\\:d\\:3}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.75[a]`,
    `[1:v]select='between(n,${startFrame},${endFrame})*not(mod(n-${startFrame},8))',setpts=N/TB,scale=240:180,drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='OUT f=%{eif\\:${startFrame}+n*8\\:d\\:3}':x=4:y=4:fontsize=16:fontcolor=cyan:box=1:boxcolor=black@0.75[b]`,
    `[a][b]hstack=inputs=2,tile=4x10`,
  ].join(";");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      REF_VIDEO,
      "-i",
      OUT_VIDEO,
      "-filter_complex",
      filter,
      "-fps_mode",
      "vfr",
      outputPath,
    ],
    { stdio: "inherit" }
  );
  return outputPath;
}

function main() {
  mkdirSync(QA_DIR, { recursive: true });
  const sheet1 = renderCompareStrip(0, 312, "compare_0_312.png");
  const sheet2 = renderCompareStrip(288, 584, "compare_288_584.png");
  console.log(`Generated QA sheets:\n- ${sheet1}\n- ${sheet2}`);
}

main();

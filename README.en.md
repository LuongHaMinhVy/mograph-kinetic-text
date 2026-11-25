# Kinetic Text Motion Graphic Skill Maker

[Tiếng Việt](./README.md) | English

A deterministic, beat-synced kinetic typography motion-graphics engine built with [Remotion](https://www.remotion.dev/), React, and TypeScript. It turns audio tracks and lyrics into frame-accurate kinetic typography videos using reusable style packs, a spring-smoothed camera rig, automated storyboard generation, structural linting, frame-by-frame QA utilities, and bundled agent skills.

## Features

- **Deterministic Motion Engine (`src/engine/`)**: Spring-smoothed camera rig (`CameraRig`), responsive stage scaling (`StageViewport`), soft blur-slide entrances/exits (`softEntrances`), automatic contrast/legibility auditing (`legibility`), and 16+ motion-graphics primitives (kinetic words, starburst badges, diagonal halftone ribbons, zigzag tracks, hollow echo trails, plexus fields, bokeh fields, dashed orbit rings, circular text rings, flower cutouts, sticker blocks, doodle shapes, radial rays, progress glow bars, media insets, and post-processing FX).
- **5 Style Packs (`src/styles/`)**: Switchable visual themes covering dark halftone, dreamy neon glow, light pop collage, neon plexus, and pastel editorial aesthetics.
- **Audio-to-Video Pipeline (`scripts/`)**: Extract audio and onset-attack beat/energy tracks (`prep:audio`), align lyrics via ElevenLabs forced alignment or STT with `--dry-run` cost estimation (`align:lyrics`), generate continuous-camera storyboards (`gen:storyboard`), validate layout/sync rules (`lint:storyboard`), and compare renders against reference footage (`analyze:ref`, `qa:compare`, `scripts/qa/`).
- **Multi-Aspect Compositions (`src/Root.tsx`)**: Renders 4:3 (`1200x900`), 16:9 (`1920x1080`), and 9:16 (`1080x1920`) compositions, including dynamic-duration compositions driven by props JSON.
- **Bundled Agent Skills (`.agents/skills/`)**: Reusable instructions for video creation (`kinetic-mv-maker`), frame-level reference motion analysis (`kinetic-reference-analysis`), and visual/sync verification (`kinetic-qa-and-house-rules`).

## Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** (this repository uses `pnpm` exclusively with `pnpm-lock.yaml`)
- **ffmpeg** and **ffprobe** available on `PATH` (used for audio extraction, onset energy calculation, reference frame sheets, and QA comparisons)
- **ElevenLabs API key** (optional, only required when running `pnpm run align:lyrics` without cached alignments): copy `.env.example` to `.env.local` and set `ELEVENLABS_API_KEY` (or run `pnpm dlx @elevenlabs/cli@latest onboard connect --env-path .env.local`); `.env.local` is git-ignored

## Quick Start

```powershell
# 1. Install dependencies
pnpm install

# 2. Type-check the project
pnpm run typecheck

# 3. Open Remotion Studio for interactive preview
pnpm run dev

# 4. Render the default HK1999 demo composition
pnpm run build:hk1999
```

## Style Packs

| Style Pack ID | Default FPS | Visual Direction |
| --- | ---: | --- |
| `hk-1999-halftone` | 24 | Black `#050505`, crimson `#F21B14`, cyan `#00F0FF`, white; halftone ribbons, 14-point starbursts, serif emphasis |
| `dreamy-glow-dark` | 30 | Charcoal-purple `#1F1C22`, neon purple `#9B5CFF`, butter yellow `#FFF066`, pink `#FF5C8A`; soft doodles, outline starbursts, dotted orbit rings, bokeh |
| `pop-collage-light` | 30 | Off-white `#FAFAFA` with dark `#0D0D0F` contrast section; orange `#FF4518`, violet `#6C28FF`, mint `#8FD99F`; tilted stickers, paper-cut flowers, hollow echoes |
| `neon-plexus-dark` | 30 | Near-black `#06070A`, mint neon `#4EFFB2`, pale yellow `#FFF59E`, periwinkle `#5B7CFF`, coral `#FF6B5B`; animated plexus background and scanlines |
| `pastel-editorial-light` | 30 | Off-white `#FCFCFD` with dark slate `#121318`; periwinkle `#6E6BF5`, coral `#FF5A5F`, mint `#8EF0B0`, yellow `#FFE46B`; clean editorial type |

Supported FPS tiers are `24`, `30`, and `60`. Primitives automatically scale timing relative to 24 fps.

## Remotion Compositions

| Composition ID | Resolution | Notes |
| --- | --- | --- |
| `KineticDynamic` | 1200x900 | Duration and FPS resolved from `--props` storyboard JSON |
| `KineticDynamicVertical` | 1080x1920 | 9:16 vertical variant driven by `--props` storyboard JSON |
| `HK1999Demo` | 1200x900 | Hand-built Vietnamese HK1999 storyboard (`src/storyboards/hk1999-vn.ts`, 24 fps) |
| `HK1999DemoWide` | 1920x1080 | 16:9 widescreen framing of `HK1999Demo` |
| `HK1999DemoVertical` | 1080x1920 | 9:16 vertical framing of `HK1999Demo` |
| `HK1999Cantonese` | 1200x900 | Hand-built Cantonese HK1999 storyboard (`src/storyboards/hk1999-2.ts`, 24 fps) |

## End-to-End Pipeline

### 1. Prepare audio and onset energy track

```powershell
pnpm run prep:audio -- --input references/song.mp4 --audio-out public/audio/song.mp3 --energy-out src/storyboards/song.energy.json --fps 30
```

### 2. Align lyrics (dry run first)

Always run `--dry-run` first to inspect the estimated ElevenLabs credit usage before making a live API call:

```powershell
pnpm run align:lyrics -- --audio public/audio/song.mp3 --text-file lyrics.txt --fps 30 --dry-run
```

Run without `--dry-run` once confirmed. Review the generated `src/storyboards/<slug>.review.md`, apply edits back to the alignment JSON, and mark `reviewed: true`:

```powershell
pnpm run align:lyrics -- --apply-review src/storyboards/<slug>.review.md
```

Optional: add `"phraseEnd": true` to the final word of each sung line in `<slug>.align.json` for explicit scene phrasing.

### 3. Generate and lint storyboard

```powershell
pnpm run gen:storyboard -- --align src/storyboards/<slug>.align.json --energy src/storyboards/<slug>.energy.json --style dreamy-glow-dark --audio-src audio/<slug>.mp3 --title "Song Title"

pnpm run lint:storyboard -- --storyboard src/storyboards/<slug>.storyboard.json
```

`lint:storyboard` should report 0 errors before rendering. You can retime a reviewed `.align.json` to another supported framerate (`24`, `30`, or `60`) using `--fps <N>` without re-running lyric alignment.

### 4. Render stills and final video

```powershell
# Render a spot-check still frame
pnpm exec remotion still src/index.ts KineticDynamic out/<slug>_f120.png --frame=120 --props=src/storyboards/<slug>.props.json

# Render MP4 video
pnpm exec remotion render src/index.ts KineticDynamic out/<slug>.mp4 --props=src/storyboards/<slug>.props.json
```

### 5. Reference analysis and QA verification

```powershell
# Extract per-frame metrics and 60-frame contact sheets from a reference video
pnpm run analyze:ref -- --input references/ref.mp4 --out-dir out/ref-analysis/ref

# Compare rendered frames side by side with a reference video
node scripts/qa/compare-frames.mjs references/ref.mp4 out/<slug>.mp4 out/qa/pairs.png 21 45 66 150

# Measure frame-to-frame motion intensity profile
node scripts/qa/motion-stats.mjs "REF=references/ref.mp4" "OUT=out/<slug>.mp4" --fps 30
node scripts/qa/motion-profile.mjs OUT out/<slug>.mp4 30 30
```

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Launch Remotion Studio (`src/index.ts`) |
| `pnpm run build:hk1999` | Render `HK1999Demo` to `out/hk1999-demo.mp4` |
| `pnpm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `pnpm run prep:audio` | Extract MP3 audio and compute onset/energy JSON |
| `pnpm run align:lyrics` | Run ElevenLabs forced alignment or STT (reads `.env.local`) |
| `pnpm run gen:storyboard` | Generate storyboard and Remotion props JSON from alignment + style pack |
| `pnpm run lint:storyboard` | Validate storyboard timing, legibility, and layout constraints |
| `pnpm run analyze:ref` | Generate contact sheets and per-frame change metrics for a reference video |
| `pnpm run qa:compare` | Run frame comparison helper |

## Project Structure

```text
.
├── .agents/skills/          # Bundled agent skills (maker, reference analysis, QA rules)
├── docs/                    # Motion design guides and per-reference frame blueprints
├── public/audio/            # Audio tracks consumed by Remotion compositions
├── references/              # Local reference transcripts/audio (reference videos are git-ignored)
├── scripts/                 # Audio prep, lyric alignment, storyboard generator, linter, and QA tools
│   └── qa/                  # Side-by-side frame compare and motion statistics scripts
└── src/
    ├── Root.tsx             # Remotion composition registry
    ├── compositions/        # KineticMV root composition
    ├── engine/              # CameraRig, StageViewport, easing, fonts, legibility, primitives/
    ├── storyboards/         # Hand-built TS storyboards, reviewed alignments, generated JSONs
    └── styles/              # Style pack definitions (5 packs)
```

## Notes on Local Files

- Reference videos under `references/` (`*.mp4`, `*.mov`, `*.mkv`, `*.webm`), rendered outputs in `out/`, and `.env.local` are intentionally excluded via `.gitignore`.
- Hand-built storyboards (`src/storyboards/hk1999-vn.ts` and `src/storyboards/hk1999-2.ts`) are crafted directly from the numeric motion specs in `docs/blueprints/` and are not overwritten by `gen:storyboard`.

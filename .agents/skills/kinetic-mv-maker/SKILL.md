---
name: kinetic-mv-maker
description: >-
  Use when the user wants a kinetic typography music or voiceover video built in Remotion from an
  audio or video track and lyrics: preparing audio and beats, aligning lyrics (ElevenLabs),
  generating a storyboard in one of the style packs (`dreamy-glow-dark`, `pop-collage-light`,
  `hk-1999-halftone`), linting it, rendering stills and MP4, or editing the hand-built HK1999
  storyboards. Read `kinetic-qa-and-house-rules` before judging any render and
  `kinetic-reference-analysis` when a reference video must be matched.
---

# Kinetic MV Maker

Beat-synced, frame-accurate kinetic typography videos from audio, plain lyrics and style packs.
Everything is deterministic: same inputs, same frames.

## Hard rules

- Use `pnpm` only (`pnpm run`, `pnpm exec`). The lockfile is `pnpm-lock.yaml`.
- Never open, print or commit `.env.local`. Scripts read `ELEVENLABS_API_KEY` through `node --env-file`.
- Credits: always run `--dry-run` first, report the estimate, and wait for the user's yes before a
  live ElevenLabs call. Repeat runs with the same cache key cost 0.
- Never skip the lyric review step silently, and never pass `--allow-unreviewed` unless the user asks.
- Look at rendered frames before calling a video good (see `kinetic-qa-and-house-rules`).
- No emojis in storyboards, logs, docs or replies.

## What exists

| Piece | Where |
|---|---|
| Engine (camera rig, primitives, easing, legibility) | `src/engine/` |
| Composition `KineticMV` (draws any storyboard) | `src/compositions/KineticMV.tsx` |
| Style packs | `src/styles/` (`dreamy-glow-dark`, `pop-collage-light`, `hk-1999-halftone`) |
| Storyboard generator (dreamy and pop share one scene builder) | `scripts/generate-storyboard.mjs` |
| Hand-built, reference-matched storyboards | `src/storyboards/hk1999-vn.ts` (Vietnamese), `hk1999-2.ts` (Cantonese) |
| Compositions to render | `KineticDynamic` 1200x900, `KineticDynamicVertical` 1080x1920, `HK1999Demo`, `HK1999Cantonese` |
| QA scripts | `scripts/qa/` (see `kinetic-qa-and-house-rules`) |

Style details and every theme option: [references/style-packs.md](./references/style-packs.md).

## Pipeline

1. **Pick a style and fps.** `dreamy-glow-dark` and `pop-collage-light` default to 30 fps,
   `hk-1999-halftone` to 24. Use 60 only when asked; never 120.
2. **Audio and beats.**
   ```powershell
   pnpm run prep:audio -- --input references/song.mp4 --audio-out public/audio/song.mp3 --energy-out src/storyboards/song.energy.json --fps 30
   ```
   Beats are onset attacks (log-energy rise), not energy peaks, so they land on the sung attack.
3. **Lyrics: dry run, then live.**
   ```powershell
   pnpm run align:lyrics -- --audio public/audio/song.mp3 --text-file lyrics.txt --fps 30 --dry-run
   ```
   With lyrics use forced alignment. Without them use `--mode stt --lang <code>`. Speech-to-text on
   sung audio is unreliable: it can return only a "background music" tag (it did for Cantonese) or
   mishear many words (it did for Vietnamese). Treat its output as a draft and cross-check it with
   the user's lyrics or with what the reference video shows. When the user pastes full lyrics, use
   them.
4. **Human review.** The user checks `<slug>.review.md`; sync edits with
   `pnpm run align:lyrics -- --apply-review src/storyboards/<slug>.review.md`. Mark `reviewed: true`.
   Applying a review may drop custom fields such as `phraseEnd`: re-check them afterwards.
5. **Phrase ends (recommended).** Add `"phraseEnd": true` to the last word of each sung line in
   `<slug>.align.json`. The scene builder makes one scene per line (lines over 8 words split at the
   widest onset gap). Without marks it guesses from held notes and silences.
6. **Generate and lint.**
   ```powershell
   pnpm run gen:storyboard -- --align src/storyboards/<slug>.align.json --energy src/storyboards/<slug>.energy.json --style dreamy-glow-dark --audio-src audio/<slug>.mp3 --title "Song Title"
   pnpm run lint:storyboard -- --storyboard src/storyboards/<slug>.storyboard.json
   ```
   Lint must report 0 errors. For hand-built `.ts` storyboards, bundle them to JSON first (esbuild
   from `node_modules/.pnpm`) and lint the JSON.
7. **Stills, then video.**
   ```powershell
   pnpm exec remotion still src/index.ts KineticDynamic out/<slug>_f120.png --frame=120 --props=src/storyboards/<slug>.props.json
   pnpm exec remotion render src/index.ts KineticDynamic out/<slug>.mp4 --props=src/storyboards/<slug>.props.json
   ```
   Long renders can exceed a shell timeout: run them in the background.
8. **Verify** with the loop in `kinetic-qa-and-house-rules` before reporting.

## Motion model (generated styles)

Scenes follow sung phrases. The default is the continuous mode (`continuous: true` in the theme):
all scene centres sit within about 105 px of the middle, one long spring-smoothed camera path sways
between them (no cuts, teleports or whips), words blur in from one side and blur out the other,
decor outlives its scene so the composition flows, and each word travels, tilts and grows during
its life. Layouts are scattered randomly (seeded), then pushed apart and fitted inside a safe area
so nothing leaves the frame. Ghost trails and small repeat captions add density. Ghost trails and
captions never appear before the word is actually sung.

The generator tunes these per theme: `entrances`, `heroEntrances`, `entranceFrames`, `exitStyle`,
`softExitFrames`, `travel`, `wordDrift`, `cameraWobble`, `cameraSmoothing`, `fit`, `jitter`,
`dense`, `decorOverlap`, `reserved`. Add a new style by adding a theme object, not by forking the
builder.

## Hand-built storyboards (HK1999)

`hk1999-vn.ts` and `hk1999-2.ts` are written frame by frame from the motion specs in
`docs/blueprints/motion-spec-*.md`. They keep hard cuts and one-frame tricks on purpose. Two engine
passes run on them: `softenEntrances` (hard entrances become blur-slides, true one-frame hits are
kept) and the runtime legibility pass. Edit them with small scripted replacements and re-lint; do
not regenerate them. The Cantonese lyric file `hk1999-2.align.json` is verified from the reference
video, not from speech-to-text.

## Known limits (say so to the user)

- Pixel motion is still roughly 55 to 65 percent of the references, and the references have a much
  richer texture (flame, raster flowers, photos) than the vector stand-ins here.
- The generator supports three styles. The HK storyboards are not produced by it.
- Only frames and numbers were checked, not playback in a player.

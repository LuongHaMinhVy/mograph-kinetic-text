---
name: kinetic-qa-and-house-rules
description: >-
  Use before reporting any kinetic typography render as done, and whenever the user says the video
  looks stiff, text is hidden or clashes with the background, text is out of sync with the voice,
  or a scene "jumps". Holds the project's design rules (what the user rejected and why) and the
  verification loop: lint, frame-by-frame sheets against the reference, sync and legibility checks.
---

# Kinetic QA and House Rules

These rules come straight from the user's feedback on this project. Treat them as defaults; change
one only if the user asks.

## House rules

1. **Text is never hidden or blended.** Readable text stays inside the visible frame at the
   extremes of the camera sway, never sits under a ribbon, bar, sticker or shape, and never shares
   a colour with what is behind it (white on a white starburst, black on the black stage). Fix by
   placement or layer order first. Recolouring to near-black or white is the fallback and is only
   done when the new colour reads across almost the whole word. **Never add outlines, borders or
   halos to text**; the user found them ugly.
2. **New text must not be covered by old text.** Outgoing words leave (slide, blur, fade) as the
   next scene's words arrive, and nothing lingers behind the new lyric. Leaving shapes and sticker
   backings go with their word.
3. **Scenes flow; they do not teleport.** Keep scenes near each other and move one swaying camera
   between them. No jump to a far-away place, no hard cut or whip between phrases, unless the user
   asks for the cut-heavy reference style (the hand-built HK1999 storyboards are the exception).
4. **Nothing appears instantly.** Text and shapes blur in from the left, right, top or bottom,
   travel a little and sharpen; they blur out the other way. True one-frame hits only when a
   reference demands them.
5. **Text moves freely and densely.** Words keep travelling, tilting and growing for their whole
   life and differ in direction and timing; scatter layouts randomly and add small supporting text
   so the screen is busy. Scatter must never create collisions.
6. **Text matches the voice.** A word never shows before it is sung (a short pre-reveal of about
   4 frames so it is readable on the onset is fine). Ghost trails and repeat captions follow the
   same rule.
7. **Stiff means the text, not only the camera.** When the user says "stiff", look at how words
   enter, move while held, and leave before touching the camera.
8. **Accents are never clipped.** Avoid per-letter or per-word clip-mask entrances on Vietnamese or
   CJK text; keep clip insets generous.
9. **Lyrics come from the user.** Use their text. Speech-to-text on singing is a draft only.

## Verification loop

Run it after every meaningful change. Do not report success from a passing build alone.

1. `pnpm run typecheck` and `pnpm run lint:storyboard -- --storyboard <json>` (0 errors; the lint
   skips words marked `ambient` and counts leaving words as leaving).
2. **Render the stills or video, then look at frames.** Sample the places that changed and the
   scene changes, at 1-frame spacing around a change:
   ```powershell
   ffmpeg -y -i out/render.mp4 -vf "select='between(n,120,155)',scale=240:180,tile=6x6" -frames:v 1 -fps_mode vfr out/qa/change.png
   node scripts/qa/compare-frames.mjs references/ref.mp4 out/render.mp4 out/qa/pairs.png 21 45 66 150
   ```
   Read the PNG. Check: nothing covered, nothing cropped, nothing the same colour as its backdrop,
   old text clearing as new text lands, accents intact.
3. **Numbers** (only as a hint, never as a verdict):
   ```powershell
   node scripts/qa/motion-stats.mjs "REF=references/ref.mp4" "OUT=out/render.mp4" --fps 30
   node scripts/qa/motion-profile.mjs OUT out/render.mp4 30 30
   ```
   Compare busy, medium and static shares per second to see where a render is dead.
4. **Sync.** Compare when each word first becomes visible with its start time in the
   `.align.json`: no node should start more than about 5 frames before its word is sung. For
   hand-built storyboards, compare frames against the reference at the same frame index.
5. **Legibility audit.** `ensureLegible` (`src/engine/legibility.ts`) runs at render time, but a
   word that it has to fix is a layout defect: bundle the storyboard, run it, and move anything it
   reports. It only knows solid shapes and the stage background, not photos, flames, flowers or
   blur.
6. Check that the video has audio and the expected frame count (`ffprobe`).

## Reporting

State what was checked and how (frames looked at, scripts run). State what was not checked
(playback, full-length viewing). Name remaining gaps against the reference plainly. List the output
files. Do not claim a match you only measured with pixel statistics.

Known recurring defects and their causes are in
[references/pitfalls.md](./references/pitfalls.md).

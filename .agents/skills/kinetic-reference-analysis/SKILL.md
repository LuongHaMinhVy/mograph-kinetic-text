---
name: kinetic-reference-analysis
description: >-
  Use when a kinetic typography or motion-graphics video must be studied or matched: extracting
  frames from a reference video, reading how text, camera, shapes and rhythm actually move frame by
  frame, writing a numeric motion spec, or deciding which patterns to put into a storyboard. Use it
  before building or revising any style, and whenever someone says the output "does not feel like"
  the reference.
---

# Kinetic Reference Analysis

Motion cannot be judged from a handful of stills or from pixel statistics alone. In this project a
whole round of work went wrong because only 6 to 20 sampled frames were looked at: the reference
turned out to have almost no hard cuts, no overshoot, text that fades in and out rather than
popping, and long camera rolls, none of which a sparse look reveals. Study every frame.

## Workflow

1. **Extract frames.**
   ```powershell
   pnpm run analyze:ref -- --input references/<video>.mp4 --out-dir out/ref-analysis/<slug>
   ```
   It writes `metrics.json` (per-frame luma and change, hold spans, cut events) and contact sheets:
   `frames_NNNN_MMMM.png` (60 consecutive frames per sheet, one frame per cell, each labelled
   `f=NNNN`) and `cuts_atlas_*.png`. Re-run with `--window start:end` for a denser look at a range
   (max 60 frames per sheet).
2. **Read every sheet in order.** Split the work: one sub-agent per video, and for a video longer
   than about 800 frames one agent per half. Each agent reads its sheets, writes a spec file, and
   reports its 10 most important patterns. Use [references/spec-template.md](./references/spec-template.md)
   as the brief. Give agents the folder and file names, not a summary of what to expect.
3. **Ask for numbers, not adjectives.** Frame numbers, opacity ramps in frames, scale start and end,
   degrees, pixels or percent of frame size, gaps between events, easing character (snap, ease-out,
   overshoot or none).
4. **Distrust the metrics where they mislead.** `cutEvents` counts any large pixel change, so a
   continuous camera scroll or roll shows up as dozens of "cuts" (the dreamy reference has 539 of
   them and only about 5 real cuts). Count real cuts by eye on the sheets. Check the source quirks:
   one reference is 24 fps retimed to 30, another is stored at half resolution for most frames.
5. **Merge into a vocabulary.** Put recurring patterns with parameters into the style's storyboard
   or theme. Measured values found so far are in
   [references/motion-vocabulary.md](./references/motion-vocabulary.md); the per-video specs are in
   `docs/blueprints/motion-spec-*.md`. Note what was approximated and what is still unclear.
6. **Measure your render the same way**, then compare (see `kinetic-qa-and-house-rules`).

## What to record for every reference

- Text entrances and exits: opacity ramp, blur, travel, scale, per letter or whole word, clipped or
  not. Frames until it is fully settled.
- Camera: cut or continuous, zoom ratios, roll degrees, pan speed, motion blur, whether the next
  composition appears before the camera lands, and whether old and new content overlap.
- Decor: when each shape appears, how it moves and how fast, which layer it sits on.
- Depth: ghost or blurred background words, their opacity and parallax.
- Rhythm: gaps between word events, holds, bursts, breathers, the ending.
- Scale and layout: font size against frame height for hero, mid and tiny words; how often text is
  cropped by the frame; rotation angles.
- Contrast: what sits behind text of each colour.

## Cautions

- Eyeballed scales are good to about plus or minus 15 to 20 percent and angles to about 5 degrees.
  Say so in the spec.
- Do not copy a reference's lyrics, text or photos into the repo documents beyond what the work
  needs; describe the motion instead.
- A reference video is a model for motion language, not a template to trace. Match its cadence and
  physics, but adapt the layout to the new lyrics.

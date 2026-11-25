# Brief for a frame-by-frame study agent

Copy this, fill the paths and facts, and send one brief per video (or per half of a long video).

```
You are studying how a motion-graphics kinetic-typography reference video MOVES, one frame at a
time, so another engineer can reproduce it in code. Work by LOOKING at the images, not from memory.

Material (read with the Read tool; PNG contact sheets, 60 consecutive frames per sheet, each cell
labelled f=NNNN):
  <absolute folder>\frames_0000_0059.png ... <last sheet>   (list the folder for exact names)
Video facts: <file>, <fps> fps, <frames> frames, <WxH>, <palette and visual vocabulary>.
Context: <folder>\metrics.json (per-frame change, holdSpans; cutEvents over-count camera motion).

Read EVERY sheet in your range, in order. For each distinct event give exact frame numbers and what
happens frame by frame. Cover:
1. Text entrances: opacity ramp length, scale start and end, slide distance, blur, clipping or not,
   per letter or whole word, frames until settled.
2. Text exits: fade, blur, shrink, cut, length in frames.
3. Camera: cut or continuous, zoom ratios and frames, roll degrees over how many frames, pan
   direction and speed, blur, whether new content arrives before the camera lands, overlaps.
4. Decor: appearance, movement and speed of each shape, layer.
5. Depth layers: ghost or blurred words, opacity, parallax.
6. Rhythm: gaps in frames, holds, bursts (list the real hard-cut frames), breathers, the ending.
7. Scale and layout: font size relative to frame height, rotation angles, cropping, layering order.
Be quantitative (frames, percent, degrees). Say so when something is unclear instead of guessing.

Deliverable: write <absolute path>\docs\blueprints\motion-spec-<name>.md (max about 250 lines):
(a) a table of every distinct motion pattern with frame ranges and numbers,
(b) a "reusable motion vocabulary" section of 10 to 15 patterns with parameters (durations in
    frames at the video's fps, scales, angles, easing character),
(c) an event timeline with frame numbers.
Do not modify any other file. Final reply under 300 words: the 10 most important patterns with
their numbers, and anything surprising.
```

Tips: tell agents about known quirks (retimed fps, low-resolution segments, watermarks). When a
claim matters, ask the agent to verify it on a full-resolution frame (`ffmpeg -vf select=eq(n\,N)`).

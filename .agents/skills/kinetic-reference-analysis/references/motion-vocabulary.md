# Measured Motion Vocabulary

Numbers read from the four reference videos (details and frame tables in
`docs/blueprints/motion-spec-*.md`). Precision is roughly plus or minus 15 to 20 percent on scale
and 5 degrees on angle. Use them as targets, not as laws.

## Dreamy (30 fps, `ref-an-ngo-dark-purple`)

- Almost no hard cuts: about 5 in 1700 frames. Everything else is continuous camera motion.
- Camera roll bursts of 60 to 150 degrees over 20 to 55 frames, bell-shaped speed (peak 3 to 5.5
  degrees per frame), alternating direction, with 8 to 25 px per frame of pan. Between bursts a
  slow glide of 3 to 13 px per frame with almost no rotation. A spin-out can end in a hard cut that
  lands calmly on a ghosted word.
- Ordinary words: fade in from about 15 percent to 100 percent opacity over 8 to 12 frames while a
  4 to 6 px blur clears. No slide, no per-letter animation.
- Hero words (cap height 40 to 65 percent of frame height): appear fully opaque in one frame with
  about 8 px motion blur, then settle in about 6 frames (tilt 18 degrees and scale 1.15, or scale
  1.45, or a rise from the bottom edge over 4 frames). No overshoot anywhere.
- Exit: words dim to about 28 percent over about 11 frames and the camera carries them away; only
  the final group fades to zero.
- Word rhythm: a new word about every 8 frames, a hero about every 35 frames, breathers of 10 to 15
  frames, one long lull. Mid words 7 to 12 percent of frame height, captions 4 to 6 percent.
- Giant blurred copies of the current word behind it (70 to 110 percent of frame width, about 30
  percent opacity) only in the first 250 frames.
- Decor with each hero: outline starburst (25 to 45 percent of width) and a dotted ring that grows
  1.8x in 8 frames; soft star and moon blobs that dim to about 35 percent as they pass. Starbursts
  can grow from a dot: radius 0.5 to 19 percent of height in 7 frames.
- Animated letterbox bars early, a 1-frame background flash after a breather, a static end card of
  small grey caption lines with 7-frame fade-ins.

## Pop collage (30 fps, `ref-ca-ngay-light`)

- Hard camera cuts about every 15 to 17 frames for the first 6 seconds (about 11 cuts), then none:
  the second half runs on morphs only. Cuts jump in about 2.7x or out to about 0.3 to 0.5x, then
  ease back from about 1.3x to 1.0x in 3 to 4 frames. A push-in punch is 2x in 3 frames then 1.3x
  over 11.
- Typewriter text: letters appear instantly, 1 to 1.5 frames per letter for hero words, 3 to 9
  frames per word for tiny sentences. Deletion is left first, 3 to 4 frames per letter.
- Stickers either pop whole in one frame or grow from a 1 to 3 px hairline over 10 to 18 frames.
  Roll-settle: tilt from about -35 degrees to -5 over 20 frames while scaling about 1.7x.
- White to black flip is a 1-frame wipe, black lasts about 130 frames, the return is a plain cut.
- Hollow echo: one glyph repeated 6 times, a new copy every 3 to 6 frames, deleted left first.
- No global motion blur; blur appears only on big flower layers (6 to 10 px). Hero and tiny text
  can share a frame at a 10 to 20x size ratio.

## HK1999 Vietnamese (24 fps, `_luntuyett.01_7640160161155386645`)

- Word events sit on roughly a 6-frame grid (about 1/8 notes). Word birth: pop from about 45
  percent size, clipped, then full in 1 frame; outline to solid in 3 frames.
- Snap zoom-outs of 0.62 to 0.72x in one frame then a 3 to 5 frame ease. Punch zoom: one word grows
  about 4.5x in 6 frames while a strip stays still. One-frame tricks: a white inversion flash,
  morph frames, an X-cross bridge, 3 on and 3 off strobes.
- Ribbon whip-rotate 5 to 10 degrees per frame for 5 to 6 frames, then a slow mode of 0.4 to 0.57
  degrees per frame for about 170 frames.
- Panorama section: no zoom and no cuts; layers pan left at different speeds (about 3.8 px per
  frame for the lockup, 1.4 for the ribbon), the lyric line stays fixed to the screen and swaps by
  hard cuts.

## HK1999 Cantonese (24 fps, `_luntuyett.01_7640159698364615956 (1)`)

- A new character about every 7 frames. Characters unfold vertically in 2 frames, enter rotated
  about -28 degrees and unwind in 5 to 6 frames, or reveal by a clip wipe from the bottom edge.
- Punch-through cycles: a small glyph holds 3 frames then scales about 2x per frame to a white or
  cyan slab covering most of the frame, then hard-cuts to the next glyph; cycle length 6 to 7
  frames, chained four times.
- Giant hairline outline glyphs 3.5 to 4x behind words. A breather of single characters each with
  its own shape, then a typewriter ticker that slides left at about 1.5 percent of width per frame.

## Cross-cutting findings

- The references are rarely still: about 6 to 27 percent of frames are static, ours started near
  60 percent.
- "Cuts" in the metrics are mostly camera motion. Real cuts are rarer than they look.
- Text and shapes are cropped by the frame edge in a large share of busy frames in the references.
  That was reproduced at first and then rejected by the user: readable text should stay in frame
  in this project (see `kinetic-qa-and-house-rules`).

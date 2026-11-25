# Pitfalls Found in This Project

Each entry: symptom, cause, fix. All of these happened.

| Symptom | Cause | Fix |
|---|---|---|
| A ribbon or bar covers a word that should be in front | Screen-fixed shapes were drawn after the camera layer, so they beat any world-space text | `KineticMV` draws screen-fixed shapes with `zIndex <= 20` behind the world layer; keep text z above shapes |
| A word loses a letter ("SÁ G") | Black bar or ribbon over it, or the word is wider than the shape it sits on | fit the word inside the shape, move the shape behind, check layer order |
| Black text vanishes at the start of its entrance | It slid in from the dark stage before reaching its white shape | keep black-on-white words hard (`entranceDurationFrames: 1`), or fit them inside the shape |
| New lyric overlaps the old one | Old words still fully visible when the next scene begins | scenes end as the next one starts (`end = next.start + 3`) with a 7 to 10 frame `slide-out`; no dim floor in continuous mode |
| Giant sticker stays behind new text | Decor overlap extended sticker backings | sticker backings are excluded from `decorOverlap` and leave with their word |
| Sticker much wider than its word | Box computed for an unrotated word, but the word is rotated 90 degrees | skip stickers for rotated words and for boxes wider than about 460 px |
| Small repeat caption appears 1 second early | Captions were timed from the scene start, not from the word | start at `max(word start + 2, scene start + 3)`; audit nodes against the align file |
| Word cut off by the top or side of the frame during camera sway | Layout assumed the camera sits exactly at the scene centre | `fitLayout` scales and shifts the layout into a 400 x 300 px half-extent; travel points inward |
| Words collide after random scatter | Jitter ignores neighbours | `separateLayout` pushes boxes apart (inflated slightly beyond the lint's estimate), then `fitLayout` |
| Captions sit on a flower or on big words | Placement was random | captions try 14 candidate spots and keep only free ones; `reserved` circles keep them off decor |
| Outline halo looked cheap | Auto contrast fix used a text stroke | remove halos; recolour only when the new colour reads over at least 90 percent of the word box |
| Auto recolour made a word vanish | It judged worst-case on three points while a shape covered only part of the word | sample a 5 x 3 grid and require the new colour to read almost everywhere |
| Stack of glyphs overlaps (CJK) | Pitch smaller than the enlarged glyph | pitch at least about 1.2x font size; the lint estimate and the real glyph box differ, so look at a frame |
| Chorus lockup looked blurry at its cut | Soft entrances applied to a deliberate 1-frame cut | that is expected; keep a hard entrance if the reference needs the cut |
| Text mismatch after speech-to-text | Scribe misheard singing, or returned only a background-music tag | use the user's lyrics, or lyrics read from the reference video's captions |
| Hand-built file edit not applied | A long inline shell command with quotes failed silently | write the edit as a small script file, run it, check the result with a grep |
| Everything "passes" but looks wrong | Only lint and typecheck were run | render, then read frames at 1-frame spacing around changes |

## Process lessons

- The first reaction to "stiff" was to add camera motion; the user meant the text. Ask or look at
  the text first.
- Reference pixel metrics over-count camera motion as cuts. Use them for rough comparison only.
- Change one layer at a time (entrance, then exit, then camera), re-render, look.
- Back up files before scripted edits; the project has no git history.
- Renders and shell commands that outlast a timeout should be run in the background and checked
  with `ffprobe` (video and audio streams, frame count) when they finish.

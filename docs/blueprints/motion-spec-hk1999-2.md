# Motion Spec: HK1999 Cantonese lyric video (`hk1999-2`, 漫步香港1999)

Source: `references/_luntuyett.01_7640159698364615956 (1).mp4`, 731 f @ 24 fps (30.46 s), 768x576. Derived from the 13 contact sheets in `out/ref-analysis/hk1999-2/`, `metrics.json`, and frames re-extracted with ffmpeg and inspected at 2x zoom. All frame numbers are 0-based and match the sheet labels. Percentages are of frame height (H) or width (W). Values from eyeballing are marked `~`.

## 0. Source quirks (do NOT reproduce)
- Frames 1-588 are stored at 384x288 and upscaled (soft); 589-730 are native 768x576. `metrics.json` is on the upscaled grid.
- f0-26: black with a tiny grey watermark "ngchy" (~4% W wide, centre, drifts left ~8% W over 26 f). Ignore it.
- Overall architecture: one big persistent "word map" world (lyrics pre-placed on a canvas with ribbons/starbursts), a camera that drifts, whips and snap-zooms across it, plus per-glyph reveal animations. After f306 the world is replaced by clean black "breather" scenes, then the chorus/outro layout.

## 1. Table of motion patterns (frame ranges)

| # | Frames | Element | What happens (numbers) |
|---|---|---|---|
| 1 | 0-26 | black | 27 f of black (1.125 s). First cut f28 only because the scene fills in. |
| 2 | 26-28 | 華 pop | f26: glyph is a thin horizontal bar (scaleY ~0.1); f27 ~0.7; f28 1.0. Pure vertical unfold, no overshoot. Char ~22% H, x~70% W, y~43% H. |
| 3 | 27 | 14-point outline starburst | Appears whole at f27 left of 華, hairline crimson/orange, diameter ~31% H; stays through f60, then grows to ~50% H behind later words. |
| 4 | 27-34 | red wedge | Halftone-crimson triangle grows from bottom-right corner: ~10% W at f27, ~40% W at f29, ~45% W by f34, hypotenuse ~63 deg. Red splatter plate fills top-right corner f27-30 (and bottom-left f30+). |
| 5 | 33-35, 40-41, 48-50 | stack 華/燈/初/上 | One new glyph every 7-8 f (33, 40, 48), each added BELOW the previous (vertical stack, glyph ~22% H, pitch ~19% H). Glyph shows as a partial/mis-built shape for 1-2 f (登 at f33-34 then 燈 at f35; 衤 at f40 then 初 at f41; base stroke of 上 at f48) = stroke-wipe from the bottom edge. A halftone red box (28% W x 20% H) pops under the stack at f34, a second red block at f41. |
| 6 | 42-56 | stack scroll | Camera scrolls up ~1% H/frame (f42-47), 1.5%/f (f48-56): 華 leaves top f49, 燈 f56. White solid notched starburst (~12% H) pops at 上 at f49 and grows to ~25% H by f60. |
| 7 | 57-61 | punch + exit | Scroll accelerates (~3% H/f at f57, ~35% H/f at f59-60, ease-in). 初 scales 1.0 -> ~1.25 while leaving upward; only a sliver left at f60, gone f61. |
| 8 | 61-66 | label typewriter | Red halftone label (22% W x 8% H): 燈 f61, 光 f62, 只 f63-64, 為 f65-66: one char per 1-2 f (wipe-in from bottom). Giant hairline outline 光 (~4x glyph, ~110% H) sits behind f62-79. |
| 9 | 69-76 | 你 + cyan | 你 enters from the top-right edge f69, settles f71 (~30% H, bigger than the label text). Cyan (#00E5FF-like) rectangle above it (f70-77, ~8% W x 2.5% H) and cyan fringe ~3 px on one stroke. Whole scene drifts right ~0.5% W/f. |
| 10 | 77 | snap zoom-out | f76 -> f77 scale ~0.55 + pan; biggest metric spike (diff 75). Reveals 我 (cyan, 22% H, with white offset ghost), ribbon at ~80 deg, ice-blue giant starburst top-right (f77-90, ~35% W, cropped), 8-9 point outline starburst under ribbon. |
| 11 | 82-86 | 隆 / 重 | Small stacked chars (cyan tint, ~9% H) clip-wipe in at f82 and f85. |
| 12 | 89-98 | whip pan | Scene slides right (camera left): ~10% W/f at f90-93, ~4%/f f94-96, ~1%/f f97-98 (ease-out). Cyan block top-right f89-95. 登 enters left f93-94, drifts to centre. No blur, only ghost duplicates of 你 f91-92. |
| 13 | 99-114 | 登場 hold | 場 clip-reveals f102-104; 登場 (~24% H) sits on the label with a tall red pillar (8% W) at left; white starburst ~16% H bottom; slow left drift ~0.8% W/f; cyan fringe on 登 f114. |
| 14 | 115-116 | cut | f115 = overlap frame (ghost of 登場 + 把 starburst); f116 hard cut to new framing: black, splatter bottom, 把 + small white starburst (8% H), 場 at right. |
| 15 | 116-146 | 把嘴堵上 | Chars are small: 把 ~9% H; 嘴 ~15% H clip-in f123-125; 堵 ~8% H f130-133; 上 ~30% H f137-143 (scale 0.6 -> 1.0 in 5 f). Large 14-pt outline starburst (~55% H) slides in lower-left f120-124. Camera drifts up-left ~0.8% W/f. Red halftone pillar passes through f144-147. |
| 16 | 147-158 | 情話留 stack | 情 f147, 話 f148-150, 留 f152-155 (rises in from bottom, 22% H). |
| 17 | 159-165 | vertical whip | f159 jump up ~55% H (diff 35.5), ease-out over 6 f. 在 f159-160, 嘴 f162-166 clip-in from bottom. Red bar + notched outline appear bottom-left f159. |
| 18 | 166-180 | 邊也 | 邊 rolls in from top-left f166-168 (sliver, 70%, full), 37% H, with offset rainbow-fringed hairline echo of itself (down-left ~4% W). 也 draws on f173-176: THICK red (#E83020) glyph, 25% H, white 邊 overlaps it. White starburst flips to pale cyan f173-176, white again f177. |
| 17b | 181-188 | 無 overwrite | 無 (white) overlays 也 with interleaved strokes (f181 half, f182 85%, f183 solid), group rolls ~ -8 deg and shrinks ~0.85x over f181-188; 在/嘴 collapse f184-185. f188: red splatter blooms top-right (1-f jump to ~25% W). |
| 19 | 189-191 | morph | f189 無 alone; f190 orange flame-gradient + a "+" cross flash and rotated orange slab; f191 glyph becomes 妨 (orange gradient), giant outline 妨 fades in. |
| 20 | 192-212 | 妨 hold | 20 f hold, 22% H, orange fire gradient. Giant hairline outline 妨 (3.5-4x, >100% H) behind; splatter bottom-left grows. f212 shrinks to ~70%; f213 = 3 dots only (dead frame). |
| 21 | 214-224 | 喜 | Enters as a partial rotated ~ -25 deg (f214), -15 (215), -6 (216), -2 (217-219), 0 (220-224); white, 25% H. Outline 妨 vanishes at f220 (hard). Hold 5 f. |
| 22 | 225-232 | 歡 | f225: white 14-pt outline starburst (~50% H) around 喜 + small orange starburst + orange stroke; f226-231 orange 雚 half scales up beside white 喜 ghost; f232 giant white 歡 slab rotated ~ -30 deg, ~2.5x (1 f). |
| 23 | 233-246 | 怎 on ribbon | Ribbon ~35% H thick with orange lotus texture: -28 deg at f233, ~ -60 at f238, ~ -80 (near vertical) f240-246. 怎 rotated -25 -> 0 by f238. f239-246: 3-4 orange echo copies of the glyph (offset/rotated, ~3 f lag) morph 怎 -> 麼-like shape. |
| 24 | 247-264 | 藏 + punch | f247 white 藏 slab ~2.2x rot -35 deg from bottom-left; f248 2x; f249 1.4x (-18); f250-251 1.1x (-10). Second ribbon crosses (X, +/-35/55 deg) f247-260. Push-in 1.0 -> 1.25x (f251-260, ~2.5%/f), then f261 x1.45, f262 x2.6, f263 x~6, f264 ~70% white. |
| 25 | 265-271 | 悸 cycle | f265 hard cut: small 悸 (18% H) on a ~horizontal ribbon + outline starburst + tiny orange starburst; hold f266-268; f269 rot +20 deg x1.4; f270 +30 deg x2; f271 white slab x6. |
| 26 | 272-277 | 動 (cyan) | Cut f272: small cyan 動 (18% H) on 35 deg ribbon; f273-275 grows 1.0 -> 1.5, ribbon swings to ~60 deg; f276 x2.2 (ribbon fills red); f277 x6 cyan slab. |
| 27 | 278-293 | 怎 / 麼 cycles | f278 white slab; f279 small 怎 (14% H, rot +25) with solid orange halftone starburst (12% H) + big outline starburst (70% H); f280-283 rot -> +40, x1.3; f284 麼 x1.8, f285 x3.5, f286 x6; f287 white rotated square 70% of frame with black window; f288-289 麼 ~30% H rot -10; f290 x1.5; f291-293 slabs x3-6. |
| 28 | 294-305 | 涼 + slabs | Small 涼 (~16% H) with dim pale-rainbow outline echo (2x); white polygon slabs (pieces of a giant glyph) rotate/slide across for 12 f; red notched starburst (35% H) enters right f303-305. Largest metric run: diff 100-150 f286-306. |
| 29 | 306-359 | breather | Black. One char per 6-9 f at centre, ~19% H, entering rotated ~ -28 deg and un-rotating to ~0 over 5-6 f (ease-out, no overshoot). Decoration changes per beat: see vocab 12. |
| 30 | 349-354 | slash | 一 rendered as a single thin white stroke ~12% W long, ~ -35 deg, held 6 f (metrics hold 350-354). |
| 31 | 360-371 | fade | 方 + orange bar (tilted ~ -15 deg) fades linearly to black over 12 f (f365-372 counted black by metrics). |
| 32 | 372-420 | ticker | Small white light-weight sans, 14-16% H, one char per 5-8 f: 就 f372, 把 f377, 月 f385, 光 f392, 打 f399; line grows right while the whole line slides left ~1.5% W/f. New char = bottom-up clip sliver; old char leaves by top-down clip (f393 就 bottom half only). f400-420: only 打 remains. |
| 33 | 421-432 | chorus cut-in | Hard cut f421 into zoomed chorus layout (title 漫步香港1999 ~1.6x of its wide size, cropped at right). Settles with exponential ease-out over ~12 f (offset steps ~38, 26, 16, 12, 10 px at 768 then 0). 開 (white italic ~15% H) beside red ribbon, ticket bottom-left, fire tiles, glow bar. |
| 34 | 433-463 | slow drift | Title slides left ~5 px/f (0.65% W/f); ribbon rotates ~ -0.4 deg/f in screen terms (lean "/" ~70 deg -> ~80 deg). |
| 35 | 464 | snap zoom-out | 1 f jump to ~0.63x (title cap pitch 54 -> 35 px at 384 grid); 開 ghosts for 1 f (crossfade) while lyric 讓夢照進窗台 (~10% H, white light sans) is on screen. |
| 36 | 465-680 | panoramic drift | Camera drifts: title/glow bar leave left (~1.5 px/f at 384 grid), wireframe 步/19 + neon sign + zigzag come in right. Ribbon sweeps through vertical (~f500) to a "\" ~45 deg by f620 and slides off lower-left. |
| 37 | 552, 639 | lyric swap | f552: 讓夢照進窗台 -> 我愛的女孩 (clean swap; first char tinted cyan f552-553). f639: 1-f overlap of 我愛的女孩 and 站在只屬於我們的舞台 (first 2 chars cyan 2 f). |
| 38 | 661-678 | lyric fade | Last lyric fades linearly over ~18 f. |
| 39 | 681-730 | outro | Ribbon cut off at f681 (hard); small red corner triangle until ~f689. Then 49 f of near-static wireframe 步/19, red-yellow tile, tilted neon sign; drift only ~0.6-1 px/f. No end card. |

## 2. Reusable motion vocabulary (24 fps)

1. Beat cadence: new element every 7 f (range 6-9); stack/breather/ticker all use it (0.29 s). Holds are multiples: 3, 5, 6, 12, 20 f. Easing everywhere: snap/ease-out, never overshoot.
2. Unfold pop: scaleY 0.1 -> 0.7 -> 1.0 over f0-f2, transform-origin centre, no X change.
3. Stroke-wipe reveal: clip window opens over 2-3 f, usually from the glyph's bottom edge upward; first frame shows only the lowest stroke ("┴"). Exit variant: clip closes top-down over 2 f.
4. Rotated pop-in: enter at -25 to -30 deg, unwind to 0 over 5-6 f (-28, -20, -12, -6, -2, 0). Char starts at ~0.9x. Used on every breather char and 喜.
5. Vertical stack build: new char below previous every 7-8 f, pitch ~0.85x glyph height, camera scrolls up ~1% H/f to keep stack on screen, then ease-in scroll (1% -> 35% H/f over 4 f) to kick it out.
6. Punch-through cycle (悸動怎麼, 藏): hold 3 f small, then scale 1 -> 1.4 -> 2.5 -> 6 (about x2 per frame) over 3-4 f with growing rotation (up to +/-30 deg) until the glyph is a white (or cyan) slab covering 70-100% of frame, then HARD CUT to the next small char. Cycle length 6-7 f; cut diff 100-150 on slab frames.
7. Whip pan: 10 f total, speed 10 -> 4 -> 1% W/f (ease-out), no motion blur; for vertical whip use a 1-f jump of ~55% H then 6 f ease-out.
8. Snap zoom-out: 1 f jump to 0.55-0.63x (f77, f464), no easing, followed by slow drift.
9. Hard cut + settle: cut in at 1.6x scale offset ~5% W, ease-out exponentially to rest in ~12 f (f421).
10. Starburst set: 14-point notched star. Variants: hairline outline (crimson/orange or white, 31-70% H), solid white (12-25% H), solid orange halftone (12-35% H), solid red halftone (f303), ice-blue (f77-90, 173-176). Pops at full size in 1 f, may rotate ~2 deg/f; white one changes colour (white -> cyan -> white).
11. Ribbon / wedge swing: halftone crimson band ~35% H thick (orange lotus texture on some). Angle sweep -28 -> -60 -> -80 deg in 6-7 f (ease-out), a second band crossing for an X. In chorus rotates ~0.3-0.4 deg/f continuously. Hard exit at f681.
12. Breather decoration per beat: orange tile (獨), orange starburst (留), outline square 30% H rotating -30 -> -3 deg (紅), orange disc + thin circle outline 38% H (燭), dark-red outline echo of the char at ~1.7x offset +12% W/+10% H (照), 14 thin radial lines with cyan/pink fringe radius ~24% H (亮), single diagonal stroke (一), orange tilted bar (方).
13. Giant outline glyph: hairline crimson outline of the current word at 3.5-4x, behind the small solid glyph (光 f62-79, 邊-echo f167-188, 妨 f191-219, 涼 f294-306). Disappears in 1 f; no fade.
14. Cyan emphasis: solid cyan (#00E5FF-ish) text or bar for 你/我 pair (f70-91) and 動 (f272-277), cyan 3 px edge fringe on ordinary white chars at transitions (f114, f552). Offset white ghost behind cyan char ~1.5% W.
15. Overlap/ghost frame at swaps: exactly 1 f of both states at f115, 319, 326, 341, 464, 639. Uses straight 50/50 crossfade, not a dissolve.
16. Typewriter ticker: 5-8 f per char, line slides left 1.5% W/f, bottom-up reveal and top-down erase.
17. Echo trail: 3-4 copies offset 3-6 px and rotated 3-8 deg lagging by 1 f each, orange tint (f239-246).

## 3. Event timeline (frame = start)
26 華 unfold | 27 starburst + wedge + splatter | 33/40/48 stack 登-燈, 初, 上 | 49 white starburst | 57-60 scroll-out punch | 61 label typing | 69 你 (cyan) | 77 snap zoom-out, 我 | 82 隆 | 85 重 | 89-98 whip pan | 93 登 | 102 場 | 115 overlap | 116 CUT 把 | 123 嘴 | 130 堵 | 137 上 | 147 情話 | 152 留 | 159 vertical whip, 在 | 162 嘴 | 166 邊 | 173 也 (red) | 181 無 | 188 splatter bloom | 190 morph | 191 妨 | 212-213 dead frame | 214 喜 | 225 歡 | 232 slab | 233 怎 on ribbon | 239 echo | 247 藏 slab | 260-264 punch | 265 悸 | 272 動 cyan | 278-279 怎 | 284 麼 | 294 涼 | 303 red starburst | 306 獨 | 312 留 | 319 紅 | 326 燭 | 335 照 | 341 亮 | 349 一 | 355 方 | 360-371 fade | 372 就 | 377 把 | 385 月 | 392 光 | 399 打 | 421 chorus | 464 zoom-out | 552 lyric 2 | 639 lyric 3 | 661-678 fade | 681 ribbon off | 682-730 outro.

Hard cuts (isolated metric spikes / visible cuts): 77, 116, 159, 233, 248, 265, 272, 278, 288, 306, 421, 464. Slab-run high-diff frames: 262-265, 270-272, 276-279, 284-288, 290-306. Gaps between cuts: 39, 43, 74, 15, 24, 7, 6, 10, 18, 115 (306 -> 421 has no cuts: breather + ticker). Black/near-black spans: 0-26, 349-354 (slash), 365-372.

Phase map: cold open 0-26 (27 f) | map pan 27-190 (164 f) | word-hit run 191-305 (115 f) | breather+ticker 306-420 (115 f) | chorus 421-680 (260 f) | outro 681-730 (50 f).

## 4. Scale and layout
- Glyph height / frame height: 華燈初上 ~22%; 你 30%; 我 22%; 登場 24%; 把 9%, 嘴 15%, 堵 8%, 上 30%; 邊 37%; 也 25%; 妨 22%; 喜 25%; 怎 14-25%; 藏 ~45% (up to 55% before the punch); 悸 18%; 動 18% (-> 35%); 麼 30%; 涼 16%; breather ~19%; ticker 14-16%; chorus lyric ~10%; chorus title ~8% (wide) / ~13% (zoomed). Only punch frames exceed 100%.
- Giant outline glyphs: 3.5-4x of the solid glyph.
- Rotation: glyphs only in pop-in (-25..-30 deg) and punch (+/-30 deg); ribbons -28..-80 deg; scene roll ~ -8 deg only f181-188 (uncertain).
- Crop frequency: ~40% of f27-305 have a glyph or starburst cropped by the frame edge (stack scroll, whips, slabs). Breather/ticker/chorus never crop text (except the title drifting off left).
- Layering (back to front): black bg > splatter plates (corners top-right/bottom-left; the brief's "top-left" splatter was NOT seen, top-right dominant) > giant outline glyph > ribbons/wedge/pillars/label boxes > starbursts > solid glyph > cyan accents/echo > white slab frames. Halftone dot texture on all red areas.
- Colours: crimson-red #EE3322 halftone, orange fire gradient (#FF8A20 -> #E83020), white glyphs, cyan #00E5FF, ice-blue starburst ~#CDEFF5, outline hairlines dark red/crimson, rainbow fringe on echoes.
- No motion blur anywhere; speed is conveyed by ghosts, echoes and 1-f jumps.

## 5. Differences versus the Vietnamese sibling (blueprint sections 2-3)
Present here, absent there:
1. Rotated per-glyph pop-in with unwind (-28 deg -> 0) and stroke-wipe/partial-glyph reveal; component morphs (登->燈, 無->妨, 喜->歡).
2. Punch-through slab cycles chained 4 times (悸動怎麼, 藏, 涼): f247-305, ~60 f of near-constant zoom + white slabs. Sibling has one zoom (146-152).
3. Cyan solid glyph filling the screen (動 f277).
4. Giant hairline outline glyphs behind words (妨, 光, 涼) and outline echoes with rainbow fringe.
5. Breather made of 8 single chars on rotating shapes (square, circle, disc, 14-ray burst, slash), then a typewriter ticker with bottom-up clip; sibling has a small centred serif line + three "13 giờ đêm" flashes.
6. Three-line chorus lyric (swaps f464/552/639, overlap frames, cyan tinted first chars) and 18 f lyric fade; 1-f snap zoom-out at f464 after a 12 f settle, vs. sibling lockup.
7. Long outro (50 f) with only wireframe + sign drifting; ribbon hard exit at f681.
8. Extra items: vertical halftone pillar with kanji texture (f144-180), ice-blue giant starburst, orange lotus-texture ribbons (f233-260), X crossing ribbons.
Absent here, present there: white full-frame inversion flash (VN f183: none here; nearest is slab f298 ~70% white), dual-layer serif background words, "TÌNH"-style censor-bar stretched glyph, 1-f X-cross bridge, horizontal glow sweep intro (glow bar is static-then-drifting here), 2-frame corner overlap into chorus (here plain hard cut at f421, no overlap).

## 6. Unclear / not verified
- Exact scale values on slab frames (glyph partly out of frame; x6 is an estimate from stroke thickness).
- Whether 妨 / 歡 / 麼 morphs are true glyph morphs or two stacked glyphs with clipping; reproduce as stacked glyphs with 1-2 f clip.
- Ribbon angle in the chorus is read from wedge edges (tapering shape), +/-8 deg.
- Splatter position vs the brief (top-left); lyric reading of a few glyphs (涼, 一) is approximate.

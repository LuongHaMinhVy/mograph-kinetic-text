# Motion Spec: HK1999 Vietnamese lyric video (`hk1999-vn`)

Source: `_luntuyett.01_7640160161155386645.mp4`, 768x576, 24 fps, 588 frames (24.5 s).
Method: every contact sheet read frame by frame, plus full-resolution crops (ffmpeg) and pixel measurements
(red-mask ribbon axis, bbox of text, white/luma ratios, `metrics.json`) to confirm.
Precision: scales +-15 %, angles +-5 deg, frames exact unless marked "~". Percentages are of frame width (W=768) or height (H=576).
Angles use math convention (0 = horizontal, 90 = vertical, "/" = <90, "\" = >90); positive rotation = counter-clockwise (CCW).
No audio was available: tempo statements are inferred from event spacing only.

## 0. Corrections to `reference-frame-blueprints.md` section 2

| Old claim | Measured |
|---|---|
| red wedge enters f24 | first red pixels f22 (tiny corner), f23 clear |
| starburst f22-26 "nở" | f22 dia 172px (22% W), f23 210, f26 250, f29 280, f31 300, f39 340: +45 % in 4f, then ~+1.5 %/f |
| NHỮNG zoom 3.5x | text width 41 % W (f146) -> >100 % (f151) -> stroke-only (f152): ~4.5x in 6f |
| f168-172 "wide ribbon hold" | the white strip keeps rotating and widening: white area 54 % (f168), 65, 81, 93 % (f171) = near full-white; f172 is the hard cut |
| VẦNG 203-206, TRĂNG 207-213, KIA 214-221 | VẦNG 203-207, TRĂNG 208-212, KIA 213-221 |
| f284-285 overlap 2 frames | only f284 shows old TRĂNG together with the new lockup; f285 is clean |
| f286-317 "zoom cận" | no zoom: ribbon slides in from right (ease-out) + lockup pans left; scale constant |
| f318 "snap zoom-out" | confirmed, measured 1.5x (1 frame) |
| outro 486-587 | lyric line ends f480 (cut f481); ribbon stays to f543; pure wireframe outro = f544-587 |
| `làm` "spin-shrink" | not a shrink: red NỒNG shears/rotates into small white `làm` (blurred, ~13 % W, +20 deg) f121-125, shatters f126 |
| `TÌNH` f58-65 "censor-invert" | ƯỚC (cyan) is replaced in place by TÌNH f58-60; cyan only survives as stripes inside TÌNH |

## (a) Table of motion patterns with frame ranges

| # | Frames | Pattern | Numbers |
|---|---|---|---|
| 1 | 0-20 | pure black lead-in | 21 f = 0.875 s, luma 1.5 |
| 2 | 21-22 | `vẽ` pop + starburst birth | f21 text ~45 % size, bottom half clipped (14px wide); f22 full size (28px wide) with 14-point thin wire starburst (red-yellow gradient line, 172px) |
| 3 | 22-39 | red wedge (halftone) grows from bottom-right corner | tip f22, ~16 % of frame area by f33; edge "/" ~60 deg; neon-sign photo (yellow squiggles) visible inside from f35 |
| 4 | 27-30 | `LỜI` outline -> solid | f27-29 hollow thin stroke (tall condensed, ~20 % H), f30 solid white: 3f |
| 5 | 29-33 | red label rectangle grows | f29 45x35px (at 768), f33 ~170x70px; then rotates ~-5 deg by f39 |
| 6 | 34-35 | `hẹn` slide-up in clipped box | f34 ~40 % visible (clipped at box bottom), f35 full + ~8 % overshoot above box; f36-39 group scales ~1.35x (starburst 280->340px) |
| 7 | 39-40 | cut + zoom-out ~0.72x | group jumps up-left; new wide red ribbon with neon-photo texture; red box left; `ƯỚC` white slides up (clipped) f40-43; diff 57 |
| 8 | 44-45 | recolor cut | f44 cyan dot appears (starburst nucleus), f45 (diff 75, biggest early cut): ƯỚC white -> cyan #00F0FF, red label -> black censor bar, `nếu` appears (f45 unaccented, f47 `nếu`), solid cyan 14-pt starburst pops 0.5->1.0 f44-47 |
| 9 | 54-55 | `duyên` slide-up | f54 top half visible, f55 full; hollow red starburst behind it f55-57 (~10 %W -> 20 %W) |
| 10 | 58-66 | `TÌNH` in-place replace + float up | f58 ƯỚC strokes -> TÌNH, black bar on top, cyan stripes inside letters f58-65; height 46 % H (f60) -> 52 % (f64) -> >65 % (f67, top cropped); white fringe cyan |
| 11 | 66-78 | white solid 14-pt starburst grows from bottom-right | f66 corner tip, f67 ~45 % W, f78 ~62 % W; `ta` (f67, white/cyan sans bold) above, `có` black inside slides up f72 (clipped), page scrolls up ~3 %H/f |
| 12 | 79 | snap zoom-out 0.68x | f78 starburst ~62 % W (cropped) -> f79 ~42 %; ease to ~0.5x by f84 (~40 % W); TÌNH shrinks with it and exits f81; luma 99 -> 55 |
| 13 | 79-83 | red halftone bar enters | small bar ~12 % W, angle -10 deg, appears bottom-left f79, drifts right/down, -5 deg by f107 |
| 14 | 80-101 | `lỡ` appears under starburst | f80 clipped, f81 full; held to f101, f102 half-covered by starburst, gone f103 |
| 15 | 84-108 | near-hold: starburst + bar, slow drift up | diff 2-6, starburst top-cropped, slides up ~0.3 %H/f; f108-109 exits top (only lower tips); f110 all black (diff 28) |
| 16 | 109-114 | `TÌNH` white thin condensed, small | f109 enters tilted +12 deg with red bar above, f110 upright (~20 % H tall, 12 % W), micro drift down ~1 %H/f |
| 17 | 115-120 | `NỒNG` fire-gradient morph in | f115 NỒNG slides up from lower-right at ~20 deg overlapping TÌNH (1-frame overlap), f116 ~-8 deg, f118 upright; white cross-hatch + flame texture; 22 % H |
| 18 | 121-126 | NỒNG -> `làm` -> shatter | f121 white slash + dots, f122 `làm` white blurred +20 deg over red ghost, f123-125 hold, f126 white arc fragments fly left, then hard cut |
| 19 | 127-133 | horizontal red ribbon + `sao` | ribbon 36 % H thick, full-width, with neon-char texture (yellow 茶 glyphs); axis 6 -> 16 -> 22 -> 26 -> 30 -> 33 -> 39 deg (f127..133): ~5.5 deg/f, eased; `sao` white tilted -20 deg ~20 % W; ribbon turns orange fire f132-133 |
| 20 | 134-141 | ribbon swing + `GIẤU` rotate-in | f134 cut: red solid 14-pt starburst (halftone fire), ribbon axis 51 -> 69 -> 81 -> 87 -> 90 deg (f134-138), GIẤU from ~60 deg tilt/sheared (f134) -> -10 deg (f135) -> -3 deg (f138); width of ribbon 8 % W |
| 21 | 141-145 | `GIẤU` punch zoom | height 100 -> 105 -> 120 -> 150 (relative, f141..145): ~1.2x/f for 2f; starburst grows with it; ribbon axis 99 -> 121 deg; diff 28 at f145 |
| 22 | 146-152 | `NHỮNG` continuous zoom | f146 cut: width 41 % W (17 % H high), white "\" strip 45 deg (13 % W thick) + red wire starburst; f147 53 %, f148 65 %, f149 78 %, f150 92 %, f151 >100 %, f152 only stroke bars: ~1.25-1.3x/f then ~1.6x last step; rotation +10 deg CCW constant; flame texture on N-H-Ữ-N-G; red solid on white strip |
| 23 | 153-158 | white strip + `luyến` | hard cut (diff 85): strip axis 122 deg, rotating to ~82 deg by f158; `luyến` black ~12 % W on strip, cyan zig-zag line + red wire starburst below; strip ~16 % W thick |
| 24 | 159-166 | strip keeps rotating + `lưu` red | axis f159 75, f160 55, f162 30, f164 25, f165 20, f166 8 deg; red flame `lưu` appears f159 as red dashes (1f morph), grows from 40 % H (f160) to 95 % H (f166) = ~2.4x in 6f, rotates with strip; `luyến` (black) overlaps f160-166 |
| 25 | 167 | X-cross 1f | big red wedge (top-left to bottom-right, ~35 % area) + white strip crossing, tiny black `tràn` at center; luma 102, diff 89 |
| 26 | 168-171 | `tràn` black on widening white strip | strip axis -12/-20/-22 deg; `tràn` width 16 % W (f168) -> 31 % W (f171), ~1.24x/f, tilt ~+15 deg; white 54 -> 93 % of frame; cyan wire starburst left |
| 27 | 172-173 | inversion + giant slam | f172 (diff 156): black bg, white giant `tràn` x4-5, rotated ~60 deg, tiny orange `dâng` in middle; f173 white curved shape sweeping out; f174 clean black (luma 5) |
| 28 | 174-180 | `dâng` flame text hold | ~25 % W, 17 % H, yellow->red vertical gradient, rotation -5 deg -> 0 by f177; static f177-179 (hold) |
| 29 | 180-183 | giant `tràn` returns | f180 white wedge bottom-left, f181 giant white letters (diff 124) rotate to vertical f182 (diff 134) over `dâng`; **f183 inverted flash**: white bg (luma 231, 85 % white), black `tràn` rotated ~80 deg at 30 % H, pale red serif CHUYỆN, cyan wire starburst |
| 30 | 184-189 | serif `CHUYỆN` hold | black bg (diff 225 at f184, biggest in video); thin red Times-like serif, 90 % W, cap height ~20 % H; tiny white condensed `chuyện` (6 % W) with wire starburst at centre; frames identical f185-189 |
| 31 | 190-236 | dual-layer serif BG swap + white condensed FG | BG word swaps by hard cut: CHUYỆN 184, MÌNH 190, ĐỂ 197, VẦNG 203, TRĂNG 208, KIA 213, CHỨNG 222, DÁM 229 (holds 6,7,6,5,5,9,7,10 f). FG white condensed words (12-30 % H, tilt +-8 deg) are added right of previous ones while whole FG pans left ~12 px/f; newest word flashes cyan 2-3f (`chuyện`, `mình`); FG cut at f236 |
| 32 | 190-197 | red vertical bar | enters top, 13 % W thick, axis 90 -> 102 deg, moves left 59 % -> 21 % W in 7f (~5 % W/f), then stays left edge and exits |
| 33 | 203-221 | wire asterisk (radial spokes) | ~10 red spokes, ~12 % W, lower-centre, drifts left with pan |
| 34 | 209-236 | red diagonal slash | f209 small red parallelogram top right; f214 ~35 % H long; f222 full height, "/" ~60 deg, ~13 % W thick, in front of serif, behind white FG; exits top-left f228-236 |
| 35 | 222-235 | `CHỨNG DÁM` white heavy slam | f222-228 white `CHỨNG` ~35 % H tilt -5 deg; f227-229 `DÁM` lower right -10 deg; f230-235 both ~25 % H spanning 85 % W, cropped at left |
| 36 | 235-246 | tiny `NHỮNG` white block | ~6 % W, travels left behind breather, "block" glitch over `một` f239-246 (width ~20px), gone f247 |
| 37 | 239-264 | breather: serif line | hard cut at f239; thin white serif `hẹn hò một đên trăng` 78 % W, ~8 % H, 1-2 px RGB fringe; tiny red corner top-left f240-256; static 26 f = 1.08 s |
| 38 | 252-254, 258-260, 264 | `13 giờ đêm` glitch pulses | condensed white bold + white pointer triangle, 25 % W x 15 % H at x-center 51 % (f252), 49 % (f258), 35 % (f264); 3f on, 3f off, 3f on, 3f off, 1f; period 6 f |
| 39 | 265-283 | hollow `TRĂNG` close-up pull-out | red 1-px dotted outline, tall condensed. f265 height >98 % (letters cropped, ~1.5x f266), f266 89 %, 267 84, 268 79, 269 75, 270 73, 271 70, 272 69, 274 67, 278 64 % H; centre drifts up-left slightly; **f279 snap 0.625x (64->40 % H)**, dimmer; f279-283 hold 40 % H, slides left 356 -> 298 px (accelerating 9,11,15,22 px/f) |
| 40 | 284 | corner overlap | chorus lockup arrives with TRĂNG still visible left (1 frame) |
| 41 | 284-300 | chorus lockup slide | `dạo bước` (flame-gold serif), `香港1999` (gold/red), `SÁNG` white serif -15 deg with cyan "G" edge, ticket photo bottom-left, black/white checker bars; red "/" ribbon axis 52-54 deg, 8 % area -> 25 % area; ribbon centre x 81 % -> 63 % W (f284..300), ease-out; scale constant |
| 42 | 287-299 | green-yellow glow bar | enters from right edge f287, ~22 % W long at f288, 1.5 % H thick, soft blur; drifts left with lockup; exits ~f463 |
| 43 | 300-318 | lockup hold + slow drift | ribbon x 63 -> 55 % W, glow bar -17 % W; small red square at right edge f312-318 |
| 44 | 319 | snap zoom-out 1.5x | `SÁNG` disappears; lockup shrinks 1.5x; neon photo (top-right) + red wire `漫`/`9` layer visible; diff 36; ribbon 53 -> 64 deg |
| 45 | 319-338 | lyric line strobe | `ước mơ của ta và nàng` white serif, 79 % W, 6 % H, y 53 % H: ON 319-322, OFF 323-325, ON 326-328, OFF 329-331, ON 332-334, OFF 335-337, ON from 338 to 392 (locked) |
| 46 | 319-543 | ribbon continuous CCW rotation | axis 64 deg (f319) -> 90 (f364) -> 105 (f397) -> 120 (f445) -> 134 (f481) -> 137 (f493+, locked): ~0.57 deg/f first 40f, ~0.4 deg/f later, ease-out into lock; area 12 -> 16 % |
| 47 | 319-420 | layer parallax pan | lockup `dạo bước`, ticket, bars pan left ~3.8 px/f (0.5 % W/f), wire/neon layer ~1 px/f, ribbon centre -1.4 px/f; lyric screen-fixed; lockup fully off left by ~f425, ticket ~f375 |
| 48 | 393-481 | lyric words swap (hard cuts) | `BÓNG` 393, `HÌNH` 402, `ANH` 413, `BÓNG HÌNH ANH YÊU` 426-480 (55 f, 70 % W, ~4.5 % H); previous word cut instantly, no tween |
| 49 | 481-543 | instrumental drift | no text; ribbon rotating then locked at 137 deg; red fire cube (halftone, 8 % W) at upper-left with zig-zag wire; neon sign top-right flickers |
| 50 | 544 | ribbon removed (cut) | red area 10 % -> 1 %, tiny red wedge bottom-left shrinks and gone f552; camera also steps ~10 px |
| 51 | 544-587 | outro hold | wire `漫步 1999` (dotted red), `9` bottom right, neon photo flicker (yellow/orange cluster changes; frames identical 559-563, 565-574, 583-587); diff ~1 |

## (b) Reusable motion vocabulary (24 fps)

1. **Pop-from-clip** (word birth): f0 ~45 % scale clipped, f+1 100 %. Combine with starburst birth: 0.75x -> 1.0 in 1f, +45 % in 4f, then +1.5 %/f. Easing: snap then ease-out.
2. **Outline -> solid** (3f): hollow thin stroke 3f, solid on 4th frame. Condensed tall type.
3. **Clipped slide-up reveal** (2f): word starts below mask edge (40 % visible), full + 8 % overshoot at f+1, then container grows 1.35x over 4-5f. Used for `hẹn`, `duyên`, `có`, `lỡ`, `ƯỚC`.
4. **Recolor beat**: white -> cyan #00F0FF on a hard cut, label box -> black censor bar, cyan solid starburst pops 0.5 -> 1 in 3f. Cyan duplicate offset ~8-10 px; thin text gets 1-2 px RGB split.
5. **Snap zoom-out + ease settle**: ratios 0.72 (f40), 0.68 -> 0.5 over 5f (f79), 0.67 (f319), 0.625 (f279). One frame step, then 3-5f decaying ease-out. Triggers a layout reveal (new layer enters at the borders).
6. **Instant close-up + expo pull-back**: start 1.5x of target, 1.0 after 1f, then 0.72 over 12f (per-frame heights 89/84/79/75/73/70/69/68/67...). Exponential decay ~ -5 % first, -3 %, -2 %. Ends with a snap (pattern 5).
7. **Punch zoom**: 1.2-1.3x/f for 3-6f (GIẤU 1.45x in 2f; NHỮNG ~4.5x in 6f, last step 1.6x). Text rotation fixed (+10 deg) and a hollow starburst scales with it. Ends by cut to next scene (no ease-out).
8. **Ribbon whip-rotate**: rod 36 % H thick, rotates 5-10 deg/f for 5-6f (6 -> 39 deg; 51 -> 90 deg), decelerating; text rides tilted with it. Second slower mode: 0.4-0.57 deg/f for 170f then ease-out lock at 137 deg.
9. **Rotating strip fill**: white bar rotates 144 deg over 18f (122 -> -22 deg; 13 deg/f peak at f158-162), width grows until 93 % white at f171; black text on it scales 1.24x/f.
10. **Inversion slam**: white-bg/black-text frame -> next frame black-bg/white-text at x4-5 scale, rotated 60-80 deg; 1-3f; repeated in f172-173, f181-183 (1-frame full-white flash at f183, luma 231).
11. **Rotate-in correction**: word starts +12..60 deg off and lands upright in 1-4 frames (TÌNH 12 deg -> 0 in 1f, NỒNG 20 deg -> 0 in 3f with 1f cross-overlap, GIẤU 60 -> -10 -> -3 deg in 3f).
12. **Dual-layer lyric**: BG thin red serif word (cap height 20 % H, 90 % W for 6 letters) swapped by hard cut every 5-10f; FG white heavy condensed words (12-30 % H, tilt +-8 deg) accumulate on a left pan (~12 px/f), newest word cyan 2-3f.
13. **Strobe pulses**: 3f on / 3f off (period 6f): `13 giờ đêm` 3 pulses (f252, 258, 264); lyric line strobe 3 pulses before locking (f319-338). Glitch block (white box over a word) 8f.
14. **Layer parallax pan**: foreground lockup 3.8 px/f, ribbon 1.4 px/f, wire/neon ~1 px/f, lyric screen-fixed; slow CCW ribbon rotation; no zoom during 225 frames.
15. **Corner slide-in lockup**: ribbon + text enter from right, ease-out (-8 % W in first 6f, -10 % next 10f, -8 % in the last 18f), glow bar enters 3f later.
16. **Vertical scroll stack**: white solid starburst + stacked words scroll up ~3 %H/f then decay to 0.3 %H/f over 25f, exits top; words enter clipped from bottom.

Texture notes: ribbons carry a halftone dot lattice ~4-5 px pitch (red #F03020 on black); flame text = vertical orange-yellow-red gradient inside glyphs, flickers; neon-sign photo visible inside wide ribbons (f35-45, f127-133) and top-right dim in panorama; wire `漫`/`9` are dotted 1-px red strokes; cyan censor bars/outline stars; serif breather has 1-2 px RGB fringe.

## (c) Event timeline and rhythm

| Frame | Event | Gap |
|---|---|---|
| 21 | `vẽ` | lead-in 21 |
| 27 | `LỜI` (outline) / 30 solid | 6 |
| 34 | `hẹn` | 7 |
| 40 | `ƯỚC` + zoom-out cut | 6 |
| 45 | recolor cut, `nếu` | 5 |
| 54 | `duyên` | 9 |
| 58 | `TÌNH` replace | 4 |
| 66 | white starburst + `ta` | 8 |
| 72 | `có` | 6 |
| 79 / 80 | snap zoom-out, `lỡ` | 7 / 1 |
| 84-108 | drift hold (25 f) | breather 1 |
| 109 / 110 | `TÌNH` | 29 from f80 |
| 115 | `NỒNG` | 6 |
| 121 | `làm` | 6 |
| 127 | `sao` + ribbon | 6 |
| 134 | `GIẤU` | 7 |
| 146 | `NHỮNG` zoom (146-152) | 12 |
| 153 | `luyến` strip | 7 |
| 159/160 | `lưu` | 6 |
| 167 | X-cross + `tràn` | 8 |
| 172 | inversion slam; 173/174 `dâng` | 6 |
| 180-183 | giant `tràn`; 183 white flash | 6 / 3 |
| 184 | `CHUYỆN` serif (diff 225) | 1 |
| 190, 197, 203, 208, 213, 222, 229 | serif swaps `MÌNH` ... `DÁM` | 6,7,6,5,5,9,7 |
| 236 | FG cut, only `DÁM` | 7 |
| 239 | breather (26 f) | 10 |
| 252, 258, 264 | `13 giờ đêm` pulses | 13, 6, 6 |
| 265 | hollow `TRĂNG` close-up | 1 |
| 279 | snap 0.625x | 14 |
| 284 | chorus lockup | 5 |
| 287 | glow bar | 3 |
| 319 | snap zoom-out 1.5x, lyric strobe | 35 |
| 338 | lyric locks | 19 |
| 393, 402, 413, 426 | `BÓNG`, `HÌNH`, `ANH`, full line | 74, 9, 11, 13 |
| 481 | lyric off | 55 |
| 493 | ribbon locks at 137 deg | |
| 544 | ribbon cut, outro start | 63 |
| 587 | end | 44 outro frames |

Hard-cut frames (diff >= ~28): 40, 45, 58, 66, 67, 79, 110, 134, 145-146, 153, 160, 166-168, 172-174, 181-184, 190-191, 196, 222-225, 227-229, 236, 284, 319. Biggest: f184 (225), f183 (170), f172 (156), f182 (134), f181 (124), f167 (89), f153 (85), f168 (82), f45 (75), f79 (75).

Rhythm summary:
- Median word gap 6-7 frames (0.25-0.29 s); events sit loosely on a 6-frame grid anchored at f21 (21, 27, 33, 39, 45, 51 ...), jitter +-3 f. That is 1/8 notes at an inferred ~120 BPM (beat = 12 f); unverified without audio.
- Sections: lead-in 0-20 (0.88 s); verse A 21-108 (3.7 s, 10 words, ends in a 25 f slow drift); rapid-fire 109-183 (3.1 s, 14 word events, 3-4 cuts per second of hard hits); serif section 184-238 (2.3 s); breather 239-264 (1.1 s, the only fully static text); TRĂNG pull-out 265-283 (0.8 s); chorus lockup 284-318 (1.5 s); panorama 319-543 (9.4 s, no hard cut except lyric word swaps); outro 544-587 (1.8 s).
- Energy curve: density rises f109-183 (word gap 6, camera shifts every 1-3 f), peaks at f166-184 (7 consecutive cuts with diff > 59), drops at f185-189 (hold), releases into f239 breather. After f284 the video never cuts again except lyric words and the ribbon removal.
- Holds (identical frames): f1-21, f177-179, f185-189, f240-246/248-251, f559-563/565-574/583-587.

## Scale and layout

- Hero condensed type: 17-52 % H at rest, deliberately overflows frame: TÌNH 65 %+ (f68-78), NHỮNG 100 %+ (f151-152), `lưu` 95 % (f166), giant `tràn` 300-450 % (f172, f181). Crop events: f68-78, f150-152, f166-168, f172-173, f181-183, f265, f330+ (lockup cropped at left for ~100 f).
- Mid words (`về`, `hẹn`, `nếu duyên`, `ta`): 5-12 % H. Lyric line (panorama): 6 % H, 79 % W; final line 4.5 % H, 70 % W. Breather 8 % H, 78 % W.
- Serif BG: cap height 20 % H, 6-letter word = 90 % W; thin 1-2 px stems; red #E03020.
- Rotations: resting text tilts +-3..10 deg; entry tilts 12-60 deg; ribbons: 52-54 deg (chorus), 6->39 (f127-133), 51->121 (f134-145), 137 (final), serif slash ~60 deg, white strip 122 -> -22 deg.
- Starbursts: 14-point; (1) thin wire red/yellow (f22-55, f146-171, f190-196), (2) solid cyan/white (f44-57), (3) solid white (f66-109, up to 62 % W), (4) solid red halftone (f134-145), (5) cyan wire (f153-183), (6) radial spokes (f203-221).
- Layering back to front: black bg, wire `漫`/`9` layer, neon photo, red halftone ribbons/strips, ticket and fire cube, serif BG words, red slash, starbursts, white/cyan condensed FG words, black censor bars, glow bar, strobing thin lyric line (screen-fixed, topmost in f319-480).
- Colours: crimson ribbon #F03020, cyan #00F0FF, white, flame gradient yellow->red, glow bar green #3FBF2F -> yellow #E8E060, black bars #000.

## Unclear / not resolved

- The extra change every 3rd frame in f320-340 is the lyric strobe (resolved); no other 8 fps stepping found.
- f121-126: exact `làm` shape is blurred; rotation 20 deg is estimated.
- Camera motion of the wire/neon layer f319-543 could not be measured by phase correlation (layer rotates); 1 px/f is read from sheets.
- The "tiny white word" f184-189 is read as `chuyện` and f235-246 as `NHỮNG` (very small, ~6 % W).

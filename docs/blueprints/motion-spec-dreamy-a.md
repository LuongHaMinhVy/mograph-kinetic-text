# Motion spec: dreamy-glow-dark, part A (frames 0-839)

Source: `ref-an-ngo-dark-purple.mp4`, 768x576, 30 fps. Read from 14 contact sheets (f0-839), plus extra full-res frame montages and a feature-tracking pass (ORB + RANSAC similarity per frame pair) for camera numbers.
Confidence: frame numbers are read from sheets (+-1 frame). Camera deg/frame and zoom %/frame are measured. Blur px and opacity % are visual estimates (marked ~).
Sign convention: rotation `+` = scene turns clockwise on screen. Percentages are of frame height H=576 (or width W=768 where stated).

## 0. Global facts worth knowing first

- **There are no hard cuts in f0-839 except two: f581 (diff 41) and f718 (diff 42, preceded by a spin-out).** Everything else is ONE continuous camera moving over a big canvas. The 140 `cutEvents` in metrics are just fast camera motion, not cuts.
- **24 fps source retimed to 30:** diffFromPrev dips every 5th frame (frames n%5==3 nearly repeat n-1, n%5==4 spikes). Animation steps are effectively 24 fps. Optional to copy.
- **Animated cinema letterbox (surprise):** black bars top+bottom grow linearly 0 -> 72 px each (12.5% H, ending at 16:9 content) over f0-f275 (0.26 px/frame/side). Hold f275-f281. Then they open f283 -> f302 with ease-in-out (69px at f284, 43px at f290, 16px at f294, 1px at f300). The opening coincides with the next composition arriving (f299). Frame content is 4:3 again from f302 on.
- Background: flat charcoal-purple `~#221e22`. No vignette or gradient visible.
- Text layers: (1) hero = very condensed bold sans, white (also yellow/purple), cap height 40-65% H. (2) mid words = rounded geometric extra-bold sans (Montserrat Black look), 7-12% H, white/yellow/purple/pink. (3) captions = same sans, semi-bold grey, 4-6% H.
- Colours: white `#fff`, cream-yellow `#f4ee8a` (outlines glow slightly), purple `#9b4dff` (hero and starbursts), pink-red `#e8486a` (one word "yêu"), grey ghost `~#6b6670`.

## (a) Table of distinct motion patterns seen

| # | Pattern | Frames | Numbers |
|---|---|---|---|
| 1 | Empty lead-in | 0-27 | 28 frames pure background (holdSpan 1-28). Letterbox already creeping. |
| 2 | Small word ghost-in | "biết" 28-36 | opacity ~15% -> 100% over 8 f, grey -> white, no slide, no blur visible, no scale change. |
| 3 | Dot -> starburst grow | 28-56 | yellow dot (f28, ~2% W) -> 12-spike outline (f29, 6% W) -> 16% W f33 -> 35% W (270 px) by f56. Ease-out, ~27 f. Outline ~3px, soft glow. |
| 4 | Purple rectangle fade-up | 29-60 | dim purple (25%) f29 -> full brightness f45; grows ~16% -> 22% W. Sits low-left of the starburst. |
| 5 | Giant blurred ghost word | "đau" 34-62, "DUYÊN" 41-72, "ơi" 66-100, "DAU" 128-165, "AI" 173-197, "chơi" 212-247 | each ghost 70-110% W wide, 25-45% H tall, ~25-40% opacity, ~8-10 px blur (some look pixelated), cropped by frame edges, parallax-slow vs foreground. Lifetime 30-45 f. Fades in ~6 f, fades out ~10 f. |
| 6 | Mid word pop-in over ghost | "duyên" 41-49, "em" 59-66, "ơi!" 66-74 | opacity 0->100% in ~6-8 f, ~4px blur clears by f+6, whole word (not per letter). "ơi!" is yellow with outer glow ~6px. |
| 7 | Moon blob | 40-80, 314-345, 508-545, 584-600, 655-690 | cream disc (crater texture visible at f530), 20-35% W, soft edge. Enters cropped at a screen edge, grows ~15 f, then dims to olive ~35% and slides away. Over-lapped by text and starburst. |
| 8 | Star blob | 48-80, 120-140, 186-210, 296-370, 548-567, 605-632 | 5-point star, cream, blurred edge, 15-30% W. Dims to olive ~40% when passed. Drifts with parallax. |
| 9 | Cream curve stroke | 39-140 | thick (~12px) round-cap cream arc, tip appears f39, becomes S/loop by f84. A world object revealed by the pan, not drawn on. |
| 10 | Photo inset reveal | 56-66, 108, 128-140, 180-186, 208-228 | grey rect 50% opacity (f56) -> blurry photo -> sharp in 6-10 f. 3-4px white border. Sizes 14-34% W. New photo in same frame: blur -> sharp in 3 f (f180-183). Photo tilts only with camera (|rot|<1deg). |
| 11 | Rose blob | 102-150 | dim red f102 -> full red f114-130 -> dim f150. Glow ~10px. |
| 12 | Slow dolly pan (no rotation) | 28-230 | content drifts 3-13 px/f (peak ~13 px/f at f160-175 and f200), dir changes ~every 40 f (left, up, left-down). Zoom +-0.4%/f. Rot within +-0.3 deg/f. Net 28->170: content zooms OUT ~x0.7. |
| 13 | Zoom-in punch (slow) | 175-205 | +1.2 to +2.1%/f for 30 f (x1.4 total); photo + "sang" grow. |
| 14 | Caption breather | 238-293 | "có em bên đời.." grey, 5% H, centered. Fade-in f238-245 (7 f). Zoom in slowly +1.1%/f f245-281 (47% -> 69% W). Photo above fades out f251-269 (18 f). Caption fades out f281-293 (12 f) to near-black. f293-298 empty. |
| 15 | Spark cluster + dotted ring ENTRY | 298-320 | f298 single yellow dot with halo; f299 purple square-dot ring (diam ~280 px, 36% W) + ~60 yellow pixel sparks; ring grows to 440 px (57% W) by f310, then fades by f320. Sparks scatter outward 12 f. |
| 16 | Hero word deblur-in | "PHÁO" 299-310 | ghost 30% + blur ~8px at f299 -> 50% f301 -> 70% f304 -> 100% sharp f309. 10 f. Slight rotate from +3deg to 0. |
| 17 | Starburst entry beside hero | 299-322 | dot f299 -> 12-spike yellow outline 7% W f300 -> 25% W f310 -> 38% W f322. Outline also gets glow. |
| 18 | Camera roll burst 1 | 319-352 | +1.5 -> +3.1 deg/f (peak f330-340) then 0.9 by f355: **+80 deg in ~33 f**. Pan content up 8-24 px/f. Zoom +2%/f f314-327 (x1.33) then -0.5%/f (x0.86). |
| 19 | Roll burst 2 (same dir) | 362-383 | +2.6 -> +4.25 (f370) -> +1.5 deg/f: **+62 deg in 21 f**. Pan content right 9-20 px/f. |
| 20 | Roll burst 3 (reverse) | 384-412 | -0.7 -> -4.0 (f395) -> -1.8 deg/f: **-75 deg in 28 f**. Zoom OUT -1.3..-2.2%/f (x0.7). |
| 21 | Roll burst 4 | 418-446 | -2.2 -> -3.2 (f430) -> -1.5: **-60 deg in 28 f**. Zoom ~0. |
| 22 | Roll burst 5 (biggest) | 462-518 | -1.25 -> -5.5 (f490) -> -0.5 deg/f: **-150 deg in 56 f**, zoom out -0.3..-1.8%/f (x0.6 total, "CHẲNG?" -> "bên đời"). |
| 23 | Roll burst 6 | 524-550 | -2.3 -> -5.1 (f535) -> -0.6: **-90 deg in 26 f**, zoom +0.3..+1.1%/f, pan up 4-21 px/f. |
| 24 | Calm drift | 552-572 | rot ~0, content drifts -5,-4 px/f. Words arrive without camera roll. |
| 25 | Pre-cut zoom-out + glitch card | 573-580 | whole scene becomes a lighter tilted card: scale -3 .. -6 %/f (x0.55 in 8 f), rot -1.5 .. -5.7 deg/f, brightness 100% -> 25%, horizontal scanline noise bands visible f578-580. Colour words desaturate. |
| 26 | HARD CUT -> hero slam | 581 | diff 41. "CÂU" at +25 deg, 66% H cap height, faint tilted rect behind (the card, ~20% opacity, rotated +30deg). |
| 27 | Hero rotate-settle | 581-587 | +25 -> 0 deg in 6 f, ease-out (f582 ~+16, f583 ~+9, f584 ~+4, f585 ~+2, f586 0). Scale 66% H -> 50% H. |
| 28 | Dotted ring grow | 581-600 | ring appears with CÂU: ~140px at f581 -> 380 f584 -> 460 f586 -> 540 f590 (70% W), dots purple squares, then fade by ~f600. Similar rings (white f608-616 around HUYÊN, yellow f640-652 around DUYÊN, purple f679-690 around BƯỚC). Each lives ~12-15 f. |
| 29 | Hero SLAM-in (fast) | HUYÊN 605, TÌNH 633, DUYÊN 641, BƯỚC 676 | absent at f-1, present at f0 at full opacity (diff 45-55), with ~6-10 px horizontal motion blur, offset 8-12% H from rest pos. Settles with ease-out in 5-6 f (blur gone by f+6). Enters cropped at bottom/right edge. |
| 30 | Hero ghost-in (slow) | TRÊN 334-343, TRỜI 346-352, TỚI! 413-420, CHẲNG? 451-460 | opacity ~20% + blur ~6px -> 100% sharp in 7-9 f. Always grey-white first. |
| 31 | Mid/small word ghost-in | e.g. "người" 718-726, "đi" 729-741, "mất" 735-745, "đành" 749-760, "thôi" 756-766, "cất" 762-773, "cổ" 774-780, "sao" 782-788 | opacity 10% -> 100% over 8-12 f, blur ~4px -> 0 over the same time, scale ~1.05 -> 1.0 (barely visible), no slide. |
| 32 | Word dims (exit) | "TRÊN TRỜI" 376-388, "CHẲNG?" 484-496, "mang" 564-572, "mất" 790-803 | white -> grey ~25-30% over 10-12 f, +blur ~3px, then camera carries it off-frame; never a hard fade to 0 in the busy section. |
| 33 | Colour-word swap | "ấm" 474-478 (olive 30% -> yellow 100%), "em" 545-550, "TỚI!" purple | colour is just an opacity ramp of an already-coloured word. No hue animation. |
| 34 | Starburst recolor/scale | yellow f299-405, purple f376-470, yellow f485-545, yellow-small f606-640, purple f655-730 | outlines 12-15 spikes. A new burst arrives each hero word, sized 25-45% W, often cropped. Rotates slowly with the camera only. |
| 35 | Butterfly/moth sprite | 395-445, 690-726 | tiny golden sprite 4% W, dim 60%, follows beside "em"/"đang". Exits 718-726 by drifting down-right and fading. |
| 36 | Spin-out hard cut | 705-718 | rot -2 -> -6 deg/f accelerating (about -45 deg in 12 f), pan content down +17..+32 px/f, zoom ~0. f717 last spin frame, **f718 cut** to calm scene (diff 42, then f719 diff 1.8). |
| 37 | Calm tail drift | 720-800 | content drifts left 8 -> 1.4 px/f (ease-out), zoom out -0.5%/f (x0.7 in 80 f), rot 0. |
| 38 | Whole group fade-out | 790-805 | "cất cổ sao" 100% -> 0 over 13-15 f (f790 -> f804), slight blur. Then empty f804-860 (holdSpan 803-860 = 58 f). |
| 39 | Caption type-on | 808-839 | "mà" ghost f808 -> solid f815 (7 f); "cổ" f817 -> 823; "sao..?" f825 -> 832. 4% H white semi-bold, centered, ~3 f slower rhythm than words above. Static, no camera. |

## (b) Reusable motion vocabulary (30 fps)

1. **Ghost-in word** (default for 90% of words): opacity 0.15 -> 1.0 over 8-10 f, linear-ish with slight ease-out; blur 5px -> 0 over the same span; scale 1.04 -> 1.0; no translation (camera supplies motion). Start colour grey-white, finish in final colour.
2. **Hero slam**: 1-frame opacity pop to 1.0, motion blur 8px along travel axis, offset 10% H from rest, ease-out settle over 6 f (cubic-out). Use for words 40-60% H cap height. Pair with diff spike (3 frames of 45-55).
3. **Hero rotate-settle**: rotation +25 deg -> 0 over 6 f ease-out (exponential, 60% done by f+2), scale 1.3 -> 1.0 over 6 f. After a hard cut.
4. **Word dim-out**: opacity 1 -> 0.28 over 11 f, blur 0 -> 3px, then leave it (don't delete) until it is off-screen; delete at 0 only on group fades (13-15 f).
5. **Camera roll burst**: rotation 60-150 deg total over 21-56 f, bell-shaped velocity (peak 3-5.5 deg/f, ~0.5 deg/f at the edges, i.e. ease-in-out sine). Alternate directions: + (362-383), - (384-412), - (418-446), - big (462-518). Add pan 8-25 px/f up/side and zoom +-1-2%/f.
6. **Camera glide**: no rotation, pan 3-13 px/f, direction change every ~40 f, zoom +-0.4%/f. Use as breather between bursts and for the opening 200 f.
7. **Spin-out cut**: roll accelerates to 6 deg/f for 10-12 f, then hard cut on the next frame to a calm composition (word at ghost opacity) with only a tail drift. Total cut cost 1 frame, next scene reads in ~8 f.
8. **Spark + dotted ring**: ring of square purple dots, diameter 36% W -> 57% W over 11 f (ease-out), fade out f+12..+21; 60 yellow pixel sparks scatter outward over 12 f and fade. Appears together with a hero entrance. Variants: ring colour follows the hero word colour.
9. **Starburst**: 12-15 spike outline, 3px stroke + soft glow. Grow 0 -> 35% W over ~25 f ease-out (first reveal), or arrive pre-sized at 25-45% W (later bursts). Rotates only with camera. One recolour per ~100 f (yellow <-> purple).
10. **Moon/star blob**: blurred cream disc/star, 15-35% W, soft edge. Enter cropped from edge over 15 f, hold, dim to 35% and drift (parallax 0.6x foreground). 1-2 on screen at a time.
11. **Giant ghost word**: same word as the foreground word, 70-110% W, 25-45% H, opacity 0.25-0.4, blur ~8px, parallax 0.5x. Ghost-in 6 f, out 10 f. Used only in the first 250 f; absent after the camera starts rolling.
12. **Photo inset**: white 3-4px border, no shadow. Reveal: grey rect 50% (1 f) -> blurred photo -> sharp over 6-10 f. Swap = 3 f blur->sharp. Keep upright (rotation only from camera).
13. **Animated letterbox**: bars 0 -> 12.5% H each over 275 f linear, hold 6 f, open over 19 f ease-in-out (the "movie" feel before the first hero word). Easy to reproduce with two black rects.
14. **Pre-cut glitch card**: scene scale x0.55, rot -5 deg/f, brightness to 25% over 8 f with scanline noise bands, then hard cut into hero at +25 deg.
15. **Caption type-on**: each word 7 f ghost-in, gap 2-3 f between words, centered 4% H, no camera.

## (c) Event timeline (frame numbers)

Gaps are frames between successive word entrances (first visible frame).

```
0-27     empty bg; letterbox creeping (0 -> 7 px each side)
28       "biết" ghost (15%), yellow dot right
29       dot -> 12-spike starburst; purple rect dim
30-36    biết rises to 100% (white); starburst 16% -> 25% W
34       "đâu" small grey + giant ghost "đau" (blurred grey, bottom, cropped) rises f34-40
36       biết solid; ghost "đau" ~30%
39       cream curve tip enters top
40       moon blob enters top-right (cropped)
41       "duyên" purple + giant ghost "DUYÊN" (dark purple) behind; gap 7 after "đâu"
48       star blob enters left-bottom
52       "trời" small grey -> white by f56
56       grey photo rect in starburst; sharp by f66
59       "em" ghost; white by f66
60       moon peak (33% W cream disc), starburst 35% W
66       "ơi!" yellow glow (+ ghost "ơi" 25% H, until f100)
70-80    moon drifts up/left and dims; "duyên" fades f70-80
84       curve now a loop; red-ish fade starts
90-101   photo blurs under motion; small grey rect left; purple rect; "cách" ghost f93, white f96
102      rose blob dim; "nhau" small mid-left f104, bottom "nhau" f107 -> bold f114
108-125  new photo (girl) sharp left; rose full f114-130; star blob right f118-130
128      ghost "DAU" olive behind + yellow "dấu" (glow) f128 -> bold f136; yellow rect appears
136      "mộng" grey -> white f141; "mây" blurred photo top-left f138
148      "tơi" purple bold f148-160; second starburst (purple outline) enters bottom-right f144
159-165  dot (tiny yellow) + curve extends; "dể" f162; ghost "AI" purple f173-197
168      yellow rect + purple rect + star blob crowd the centre; "ai" f174
180-183  photo swaps (blur -> sharp in 3 f)
184      "ngỏ" f184 -> white f190; zoom-in punch +2%/f f175-205
201      "sang" grey -> white f208 (top); purple rect right
207      yellow small rect top; 212 ghost "chơi" begins -> 100% W grey 25% by f222; photo (girl) f208-228 sharpens
222-239  photo centred (33% W), letterbox ~60px
238      caption "có em bên đời.." fades in (to f245)
245-281  caption zoom 47% -> 69% W; photo fades f251-269
281-293  caption fades out
283-302  letterbox opens (ease-in-out)
296      "nguochugg.." tiny ghost; star blob bottom-left
298      yellow spark dot
299      dotted ring + sparks; "PHÁO" ghost 30%; starburst dot
300      starburst 12-spike (7% W); 12-frame ring grow
309      PHÁO fully sharp (10 f)
314      "hoa" small (white by f318) bottom-right; moon blob faint bottom-right
318      "rực" purple (bold f324)
319-352  ROLL BURST 1 (+80 deg); PHÁO tilts cw to ~+75 (almost vertical)
326      "rỡ" yellow bottom-left (bold f334)
334-343  "TRÊN" giant white ghost-in (cap ~40% H)
346-352  "TRỜI" giant white ghost-in
360      TRÊN TRỜI full; yellow starburst 40% W right; star blob left (30% W)
362-383  ROLL BURST 2 (+62 deg); "người" f364 ghost -> white f372
376      purple starburst enters left-bottom (large, 60% W, cropped); TRÊN TRỜI dims f376-388
376      "yêu" pink f376 -> bold f382
384-412  ROLL BURST 3 (-75 deg); "ơi!" f384 -> bold f388; "anh" f389 -> f395
399      "đang" ghost -> white f405; butterfly sprite f400
413      "TỚI!" purple giant ghost -> solid f420 (cap ~35% H)
418-446  ROLL BURST 4 (-60 deg); TỚI! rolls to ~-25 deg
434      "có" ghost -> white f441 (sole word on screen f441-450: BREATHER ~10 f, only starburst + "có")
451      "CHẲNG?" giant ghost -> sharp f460 (cap ~50% H, 38% W)
462-518  ROLL BURST 5 (-150 deg): CHẲNG? goes vertical (~-85) by f488
469      "hỏi" ghost -> white f474
474      "ấm" olive -> yellow f478
485      "bên" grey -> white f491
492      "đời" ghost -> white f498
506      "LÀ" ghost -> white f512 (cap ~38% H); moon blob f508
515      "do" f515 -> f521; 521 "mây" purple -> f527; moon full f525-535 (30% W, crater texture)
524-550  ROLL BURST 6 (-90 deg); 533 "mang" f533 -> f545; star blob f548
545      "em" olive -> yellow f550
554      "với" ghost -> white f562
564-572  "mang" dims; star exits top; 552-572 calm drift
573-580  PRE-CUT: scene collapses to a tilted card (x0.55, rot -5.7 deg/f), noise bands f578-580
581      HARD CUT: "CÂU" at +25 deg, 66% H; ring starts; faint card rect behind
587      "chúc," yellow small bottom-right (bold f590)
595      "hàn" white small bottom-left (f595-600)
600      moon blob top-right dims (olive), starburst yellow bottom-left f598
605      "HUYÊN" SLAM (diff 54), 45% H cap; star + starburst bottom-left; white dotted ring f608-616
613      "đâu" purple small bottom-left; second star blob right f614
623      "đó" white small
633      "TÌNH" SLAM from bottom (diff 49-54, 3 f of spike); yellow tick-spark f633-640
641      "DUYÊN" yellow giant from bottom (diff 33); ring yellow dotted f640-652
650      "rơi" purple small bottom-left (gap 9)
655      purple small starburst + moon blob bottom (olive) f655-690
661      "vào" white; 668 "nơi" yellow; (gaps 11, 7)
676      "BƯỚC" SLAM (diff 45-55); purple dotted ring f679-690
684      "chân" purple giant from bottom-right (cap ~40% H)
692      "em" small white bottom; 702 "di"(đi) yellow small; butterfly f690-726
705-717  spin-out: rot -2 -> -6 deg/f, BƯỚC/chân fly diagonal
718      HARD CUT to calm scene: purple starburst top-left, "người" ghost 15%
726      "người" solid (8 f)
729-741  "đi" ghost -> solid
735-745  "mất" ghost -> solid (right, above)
749-760  "đành" ghost -> solid
756-766  "thôi" ghost -> solid
762-773  "cất" ghost -> solid (largest of this group, ~14% H)
774-780  "cổ" ghost -> solid
782-788  "sao" ghost -> solid; purple ring dot top-left shrinks 718-785
790-805  group fades 100% -> 0 over ~14 f (also drifting left, 1.4 px/f)
804-860  EMPTY HOLD (58 f)
808-839  caption "mà" f808, "cổ" f817, "sao..?" f825 (3-4% H, centered, white)
```

Word-entrance gap statistics for f300-720 (about 50 entrances): median 8 f, min 3, max 15; bunches of 2-3 words 6-9 f apart, then a 10-15 f breather (e.g. f434-451, f554-581).
Hero word cadence: 12 hero words in 420 f, i.e. one per ~35 f; each hero is followed by 3-5 small words.

## Rhythm notes

- **Hard cuts (f0-839): f581, f718. Those are the only two.** Soft transitions: f299 (letterbox open + new composition cross-arrives while old caption still ~5%); f573-581 (card collapse).
- **Bursts of rapid change** (diffFromPrev > 20): f330-345, f360-380, f385-400, f480-495, f530-545, f581-583, f605-620, f630-645, f650-690, f710-718. Peak 55-59 at f614-615, f677.
- **Breathers** (diff < 5): f232-300 (68 f), f440-450, f720-800 (diff 5-10, slower), f804-860 (58 f hold), and the first 28 f.
- Camera **keeps moving while text is still settling**: new word starts its ghost-in 3-6 f before camera burst peak, lands while camera velocity is falling. Old and new compositions DO overlap on screen: the previous hero stays at 25-35% grey and is carried off by the pan, 10-25 f of overlap.
- Camera always **lands slightly after** the word is readable (word 100% at f+9, camera velocity < 1 deg/f at ~f+12).

## Scale and layout

| Class | Size | Examples |
|---|---|---|
| Hero condensed | cap height 40-65% H, width of word 30-60% W | TRÊN, CHẲNG?, CÂU (66% at entry), HUYÊN (45%), TÌNH, BƯỚC. PHÁO starts 12% H at f312 and zooms to ~26% H at f330. |
| Mid word | 7-12% H | người 9%, cất 14%, mất 10%, "ơi!" 9% |
| Small word | 4-6% H | trời, em, hàn, đó, di |
| Caption | 4-5% H | có em bên đời..; mà cổ sao..? |
| Ghost background | 25-45% H, 70-110% W | đau, DUYÊN, chơi |

- Display angles: 0 deg (calm sections, f28-300, 552-573, 587-600, 720-840), +-10-35 deg (most of f300-550), ~90 deg vertical (CHẲNG? f480-491, TRÊN f372-378, PHÁO f336-345), +25 -> 0 (CÂU).
- Word crop at frame edge: in f300-720 about 70% of frames show at least one hero word cropped by an edge (almost always top/bottom/right). Hero words entering from below are cropped for their first 4-8 f. In f28-300 only ghost words are cropped; foreground words stay inside. In f720-840 nothing is cropped.
- Reading axis: the word chain follows a curving path (down-right, then up, then spiral) and the camera rolls so the next word reads roughly along the screen x-axis or y-axis. Previous word is left behind at the screen edge.

## Unclear / not determined

- Exact blur radii and opacity values are eyeballed. Starburst rotation speed (it appears to turn only with the camera) could not be separated from camera roll.
- Whether giant ghost words are separate layers or the same word copy at different scale: looks like separate blurred copies (pixelated edges on "chơi" and "DUYÊN" suggest a low-res upscale).
- The tilted card at f573-581 might be the whole scene on a card layer being zoomed out, or a separate rectangle; only its edge is visible.
- f604 -> f605 etc. "slam" words could be a very fast camera whip (frame diff 45-55) rather than a per-word animation; the measurable result is the same (word present at full opacity with ~8 px blur, ease-out settle over ~6 f).

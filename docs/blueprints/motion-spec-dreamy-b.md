# Motion spec - dreamy-glow-dark, second half (frames 840-1707)

Source: ref-an-ngo-dark-purple.mp4, 30 fps, 768x576. Read from the 14 contact sheets (frames_0840 ... frames_1680),
cross-checked with metrics.json and with full-res tiles pulled from the mp4 for the key events (861, 884, 912, 990, 1126, 1143, 1198, 1275).
Units: frames at 30 fps. "%H" = percent of frame height (576 px), "%W" = percent of width (768 px).
Confidence tags: [S] seen clearly, [E] estimated from small cells (+/- 20%), [?] unclear.

## 0. Big picture (what is different from what you might expect)

* The second half is NOT cut-driven. There are only 4 hard cuts (861, 997, 1127 flash, 1143) plus one decor teleport (1279).
  Everything else is ONE continuous camera that scrolls (up, then left, then up again) while words are added to the scene.
* There is NO "concentric" wall. The climax (1143-1402) is a **bottom-up accumulating stack**: each new word pops in below/beside the
  previous ones, nothing is removed, and the whole stack drifts upward at a decaying speed. Old words (OI!, first duyen) leave through the top edge.
* NO giant blurred ghost layer exists in this half. The "ghost" look is the first 6-10 frames of a word fade-in
  (grey/desaturated, 25-40% opacity, blurred ~3 px) before color and sharpness arrive. Depth is faked only by motion blur and soft star/moon blobs.
* NO photo inset in this half. Round "moon" disc with crater texture (934-960) and flat pale disc (1193-1220, 1254-1275), a small butterfly sprite (984-1005).
* No overshoot/bounce was seen anywhere. All motion is ease-out / expo-out or constant-velocity scroll.
* Ending: wall fades out together, then a 305-frame static end card of three tiny grey caption lines (diff = 0 because the text is tiny and low contrast).

## (a) Table of motion patterns seen

| # | Frames | Pattern | Numbers |
|---|--------|---------|---------|
| 1 | 840-861 | Small line "ma co sao..?" (white, bold rounded, ~9%H) fades out word by word, soft blur | ma 837-849, co 849-857, sao..? 857-861(cut at ~35% opacity). Each word ~8-12 f fade, stagger ~9-10 f. No movement, no scale [S] |
| 2 | 861 | HARD CUT into hero "thu" (white, condensed, ~50%H tall) | Frame 861 already fully opaque, rotated +18 deg (clockwise), scale ~1.15. Rotation 18 -> 12 -> 6 -> 3 -> 0 over 861-865 (5 f, ease-out), scale 1.15 -> 1.0 same time [S/E] |
| 3 | 861-866 | Purple dotted ring around "thu" | Appears 861 at r~17%H, doubles to r~40%H by 868 (8 f), keeps growing slowly. Dots ~3 px, ring partly dashed [S] |
| 4 | 862-868 | Moon blob top-right (soft yellow disc, d~20%H, blur ~4 px) | Opacity 0 -> 0.2 (862) -> 0.35 (863) -> 0.75 (866). 5-6 f fade-in, then rides the scroll and exits top at ~876 [S] |
| 5 | 867, 875, 893 | Small words "trang" (yellow), "tung" (white), "dem" (purple) | Full opacity within 1-2 f of first appearance, no slide, no scale. Pop. Size 8-12%H. Slight tilt -3 to -4 deg [S] |
| 6 | 885, 912, 955, 962 | Hero words TRAO, NGAY, thay, EM (45-55%H tall) | Enter from BOTTOM edge, 3-4 f rise of ~30%H with ease-out (deltas -45,-30,-15 tile px = ~16%,10%,5%H per frame), motion-blurred horizontally for 3-4 f (blur ~4 px), sharp from 4th frame. Whole word, not per letter [S] |
| 7 | 861-995 | Camera scroll UP with content | ~14-20 px/f (2.5-3.5%H/f) roughly constant, slight deceleration. Each word lives ~20-25 f from entering bottom to leaving top; cropped by top/bottom edge during entry and exit [E] |
| 8 | 876-960 | Yellow starburst outline (spiky, 12 points) | Pops at bottom-left 876 (cropped), grows to r~25%H by 886; later another small one at 910; purple one is born as a 3 px dot at 932 -> r 20%H by 940 -> r 28%H by 947 (dot-to-burst growth, ease-out). Spin not measurable (<3 deg/f) [E] |
| 9 | 882-960 | Soft yellow star blobs (5-point, blur ~5 px, opacity 0.6-0.9) | Appear 882 (r 15%H) and 891 (second, dim); drift with scroll, grow ~1.5x over 15 f; third at 900 right side. Also a dim one 984-1005 (butterfly sprite) [E] |
| 10 | 885-899 / 922-940 / 958-964 | Dotted rings, yellow then purple | 885: yellow ring r~25%H right of TRAO; 922-929: yellow ring around ZO grows r 25 -> 33%H in 7 f; 958: purple ring around thay. Each ring born at ~60% size and expands ~1.5-2x in 8 f, then fades/leaves with scroll [S] |
| 11 | 934-960 | Moon disc with crater texture | Fades in 934-937 from bottom, rises with scroll, d~16%H, "chi" sits on top at 940. Leaves top ~960 [S] |
| 12 | 948 | "MONG" yellow, rotated +12 deg, cropped by right edge | Pops at full opacity 948 (no blur seen), sits with purple starburst behind it. Exits top by ~960 [S] |
| 13 | 972, 982 | Small "an" (white), "vui" (yellow) at bottom | Pop in 1-2 f; start rotated -10 deg, camera roll takes them to -60 deg by 996 [S] |
| 14 | 986-996 | Camera ROLL whip | Whole scene rotates counter-clockwise ~ -5 deg/f (about -30 deg at 990 -> -60..-70 deg at 996), accelerating; "thay" swings in from upper left at ~1.5x scale, strong motion blur (~8 px). 7 f total [S/E] |
| 15 | 997 | HARD CUT out of the whip | Frame 997: purple starburst outline top-left, leftover butterfly dim at lower right (opacity 0.4), new word "nguoi" ghosting in. Whip never "lands"; the cut hides it [S] |
| 16 | 998-1100 | SLOW phase: slow drift, words fade in/out | Camera drifts LEFT (content left, ~1.2%W/f at 1020 decaying to ~0.4%W/f at 1080 to 0 at ~1100); metric diff 17 -> 1 [E] |
| 17 | 998-1076 | Word fade-in (grey ghost to color) | "nguoi" 998-1008 (10 f), "di" (condensed, grey) 1009-1019, CO 1018-1031 (13 f), "nho" 1029-1040 (11 f), "toi" 1037-1044 (7 f), CO#2 1044-1056, "khong" 1052-1062, "mot" 1060-1067, "loi" 1069-1075. Start at ~15-25% opacity, ~3 px blur, grey, then full white. Positions fixed in the scene; no slide [S] |
| 18 | 1031-1108 | Word fade-out, in order of age | Each word lives ~35-40 f after it is solid, then fades over 8-14 f (grey, slight blur) to 0. nguoi 1031-1040, di 1040-1050, CO 1046-1056, nho 1058-1066, toi 1070-1078, CO#2 1074-1084, khong 1090-1105, "mot loi..." 1098-1108. 3-4 words on screen at once [S] |
| 19 | 1083-1092 | Typed ellipsis | "mot loi" gets "." at 1083, ".." at 1086, "..." at 1091 (1 char per 3-5 f, pop) [S] |
| 20 | 1108-1126 | BREATHER: empty background | 19 f of plain dark bg (#231f22-ish), diff 0 [S] |
| 21 | 1127 | 1-frame FLASH + new word | Background lightens ~+16 luma (to ~#3d343a) for exactly 1 f while yellow "a" (grave) appears at screen centre, ~9%H, glow; 1128 bg returns to dark, "a" stays [S] |
| 22 | 1128-1142 | Hold on tiny "a" | 15 f fully static, then hard cut [S] |
| 23 | 1143 | HARD CUT into CLIMAX: "OI!" | Hero white condensed word at scale ~1.45 (cropped by bottom edge), settles to 1.0 (~58%H tall, x ~ 55% W) in 7 f ease-out (width 125 -> 105 -> 95 -> 90 -> 88 -> 87 -> 85 tile px) [S/E] |
| 24 | 1143-1160 | Decor born with OI! | Yellow starburst: dot (r 1%H) at 1143, r 9%H 1144, r 14%H 1146, r 19%H 1150, r ~23%H by 1160, then ~constant. White dotted ring: starts r ~33%H 1144, r ~45%H 1150, ~55%H 1160 (cropped by frame) [S/E] |
| 25 | 1151-1170 | "duyen" (small, white condensed, ~20%H) enters from bottom | Rises from bottom edge 1151 to resting y ~ 60%H by 1160, blur 2-3 f. Soft grey star blob (dim, then yellow) enters bottom-left 1153, brightens 1157-1163, drifts right/up 1.3 px/f [E] |
| 26 | 1165, 1175 | "tinh," pink (heavy rounded, ~17%H) | Enters from bottom edge 1165 (cropped), full opacity by 1169; comma pops in 1175 (and flickers on/off ~1184-1197) [S] |
| 27 | 1180-1200 | Second soft star right; moon disc | Star from right edge 1180 (large, blurred, d~22%H), moon disc rises from bottom 1193, d~20%H, then fades 1210-1220 (opacity 1 -> 0.3) as it rides up [S] |
| 28 | 1196-1205 | Yellow "tinh" fade-in | 1196 grey-olive ghost (25%) -> 1205 solid yellow: ~9 f. Same grey-to-color ramp on all later words [S] |
| 29 | 1211-1220 | Big "duyen" (white condensed, ~38%H) | Ghost 1211 (30%, blurred) -> solid 1220 (9 f). Purple dot appears 1214 -> starburst r 22%H by 1235 (cropped right) [S] |
| 30 | 1217-1259 | Small words "nao" 1217, "chang" 1226, "choi" 1237, "voi.." 1248 | Each grey/dim at ~30% for 3 f then to white over 6-8 f; ~5%H; stacked into 2 lines at lower left [S] |
| 31 | 1259-1268 | "anh" purple condensed (~50%H) | 1259 blurred ghost 30% (bottom, behind moon#2 which rises 1254-1275) -> sharp 1268 (9 f) [S] |
| 32 | 1272-1320 | "co" 1272, "doi" 1279 (grey->white 8 f), "nhung" 1290, small yellow dot->starburst 1294-1310 (r 8%H), "sao?" 1305, "long" 1311-1318, "em" purple 1324 | Same ghost-to-solid ramp, 5-9 f, sizes 4-6%H [S] |
| 33 | 1279 | Decor teleport (diff spike 10) | Right purple starburst disappears; a large blurred purple starburst appears top-left in the same frame, cropped, 2 f blur then sharp [S] |
| 34 | 1330-1372 | "DUONG" (condensed white, 20%H, blurred) 1330-1344; "NHU" 1337-1344; tiny typed line "chang dua den moi" 1350/1356/1363/1370 | Condensed words fade up over ~14 f and keep ~1-2 px blur; tiny words appear one by one, ~6-7 f apart [S] |
| 35 | 1143-1393 | Climax scroll UP (content moves up) | ~7-8 px/f (1.3%H/f) at 1160-1200; ~4 px/f (0.7%H/f) at 1220-1250; ~2.7 px/f (0.47%H/f) at 1320-1380; ~1 px/f at 1400. Exponential-like decay [E] |
| 36 | 1393-1402 | Whole wall fades OUT together | All layers opacity 1 -> 0.5 (1397) -> 0.15 (1400) -> 0 (1402), ~10 f linear; yellow starburst outline shrinks (r 22 -> 15%H) and outlasts text by ~2 f. Scroll continues during fade [S] |
| 37 | 1403-1404 | Blank | 1 f of empty bg [S] |
| 38 | 1404-1707 | End card, three grey caption lines (~3%H, grey ~#8a8a8a at 55% opacity, centre-left, no motion) | See timeline: fade-in 6-7 f, hold 50-120 f, fade-out 10-14 f, gap ~3 f between lines, 15 blank frames at end [S] |

## (b) Reusable motion vocabulary (30 fps)

1. **Hero rise-in (bottom entry)**: translateY +30%H -> 0 over 4 f, ease-out (expo-out; per-frame deltas ~ 55%/30%/15% of total), horizontal motion blur 4 px for first 3 f, opacity jumps to 1 on the first frame. Whole word, no clipping mask.
2. **Hard-cut hero settle**: first frame fully opaque, rotation +18 deg -> 0 and scale 1.15 -> 1.0 over 5 f ease-out (variant for OI!: scale 1.45 -> 1.0 over 7 f, no rotation). Cropped by frame at first frame is fine. No overshoot.
3. **Small-word pop**: opacity 0 -> 1 in 1-2 f, no scale, no slide; 8-12%H bold rounded sans; fixed tilt -4..+12 deg for the whole life of the word. Cadence: one word every 8-10 f in the fast section (mean 8.6 f, range 7-10).
4. **Ghost-to-solid fade-in (slow/climax words)**: opacity 0.2 -> 1.0 over 8-13 f (linear-ish, slightly ease-out), blur 3 px -> 0 over the same time, color from grey (#777) to final color in the second half. Position fixed; no slide or scale.
5. **Aged fade-out**: after a 30-40 f life, opacity 1 -> 0 over 8-14 f, blur ~2 px; stack of 3-4 words alive; oldest leaves first.
6. **Word-by-word sequential fade-out of a line**: 3 words, each 8-12 f fade, stagger 9-10 f, ends in a hard cut with last word still at ~35%.
7. **Continuous camera scroll with decay**: translateY of whole scene -3%H/f (fast section, 861-995) held ~constant; climax -1.3%H/f decaying to -0.4%H/f over 250 f (time constant ~120 f); slow section: translateX -1.2%W/f decaying to 0 over 80 f. Words keep their place in the scene; the camera moves.
8. **Camera roll whip**: rotate the scene 0 -> -65 deg over ~8 f (accelerating, ~ -5 deg/f at the end), plus 1.5x scale on one near element and 8 px blur, ended by a hard cut (no landing).
9. **Dotted ring bloom**: ring (3 px dots, ~40 dots) born at 60% size, scales to ~1.8x over 8 f ease-out, then ~0.3%/f; color by sync: purple around white word, yellow around white/yellow word, white at climax; can exceed the frame.
10. **Starburst from a dot**: 12-point outline star (stroke ~2.5 px), r 0.5%H -> 19%H over 7 f ease-out, continues slowly to ~23%H; yellow or purple; may be cropped by edges; pops out (teleports) on a beat rather than fading.
11. **Soft star / moon blob**: 5-point star or disc, d 15-22%H, blur 4-5 px, opacity 0.2 -> 0.75 over 5 f, drifts with the scroll + 1.3 px/f of its own; fades out over ~10 f as it rides toward the top. Crater-textured moon variant under a small word.
12. **Typed punctuation**: "." "." "." added at 3-5 f spacing, pop, no easing.
13. **Beat flash**: background +16 luma for exactly 1 f on the word's first frame (1127). Use once as a breather-exit accent.
14. **Whole-scene fade-out**: all layers share one opacity ramp, 10 f, scroll continues underneath, then 1-2 f of empty frame.
15. **Caption line (end card)**: 3%H grey text at 55% opacity; fade-in 6-7 f, hold, fade-out 10-14 f, 3 f gap before the next line; no motion, no blur change.

Scale/layout numbers
* Hero condensed words (thu, TRAO, NGAY, ZO, thay, EM, anh, OI!, big duyen): glyph height 45-58%H (font-size ~ 60-75%H), white (or yellow/purple); width 20-30%W.
* Mid words (CO, nho, DUONG NHU, small duyen): 12-22%H. Small words (trang, tung, dem, uoc, chi, an, vui, nguoi, toi, khong, mot loi, "a"): 8-12%H.
* Climax tiny words (nao, chang, choi, voi, co, doi, nhung, sao?, long, em, chang dua den moi): 4-6%H. End card: ~3%H.
* Hero-to-small ratio ~ 5:1 inside one cluster. Fonts: tall condensed grotesque for hero words, heavy rounded geometric sans (Montserrat-like) for small words and for pink "tinh,".
* Rotations used: 0 deg for hero words after settle; +18 deg only for the entry of "thu"; small words -4 to +12 deg (MONG +12, khong +8, mot loi -6); camera roll to -65 deg once.
* Cropping by the frame edge: every word in 870-995 is cropped at the top or bottom edge for 4-8 f at entry and 6-10 f at exit; the climax also crops OI! (bottom at 1143-1146, top 1210-1250), big duyen/anh at top near the end, "mot loi" at the right edge (1080-1086). Slow section words are mostly uncropped.
* Colors: hero white; accents yellow (#f4f07a-ish), purple (#9b4dff-ish), hot pink (#ee5c8a-ish); bg ~#231f22.

## (c) Event timeline (frame numbers)

Fast section (continuous scroll up)
* 840-861 line "ma co sao..?" fades word by word (ma ends 849, co ends 857, sao..? at 35% when cut). Previous hold span 803-860 (diff 0).
* 861 CUT -> "thu" (rot +18 -> 0 by 865), purple ring 861, moon blob 862.
* 867 "trang" (yellow) | 875 "tung" | 876 starburst yellow bottom-left | 882 star blob | 885 TRAO (blurred 885-888) + yellow ring | 893 "dem" (purple)
* 903 "uoc" | 912 NGAY (rise 912-915, blurred) | 920 ZO (yellow) + ring 922 | 930 "anh" (purple small) | 932 purple dot -> starburst | 934 moon disc | 940 "chi"
* 948 MONG (yellow, +12 deg) | 955 "thay" (white, -12 deg, rise 955-959) + purple ring 958 | 962 EM (purple, ~55%H)
* 972 "an" | 982 "vui" (yellow) | 984 butterfly sprite visible | 986-996 camera roll whip (-5 deg/f)
* Intervals between word entries: 6, 8, 10, 8, 10, 9, 8, 8, 10, 10, 8, 7, 7, 10, 10 (mean ~8.6 f).
* 997 CUT (diff 38): scene reset, purple starburst top-left, butterfly dim, "nguoi" ghost starts.

Slow section (drift left, ease to stop)
* 998 "nguoi" fade-in (solid 1008) | 1009 "di" (grey condensed) | 1018 CO (solid ~1031) | 1029 "nho" | 1037 "toi" | 1044 CO#2 (top right) | 1052 "khong" | 1060 "mot" | 1069 "loi" | 1083/1086/1091 dots
* Entry gaps: 11, 9, 11, 8, 7, 8, 8, 9, 9.
* Fade-outs: nguoi 1031-1040, di 1040-1050, CO 1046-1056, nho 1058-1066, toi 1070-1078, CO#2 1074-1084, khong 1090-1105, "mot loi..." 1098-1108.
* 1101-1126 metric hold; 1108-1126 truly empty (19 f breather).
* 1127 flash + "a" (yellow) | 1128-1142 static (15 f) | 1143 CUT.

Climax (accumulating stack, scroll up)
* 1143 OI! (scale 1.45 -> 1.0 by 1150), yellow dot -> starburst, white ring 1144.
* 1151 "duyen" small from bottom | 1153 grey star blob bottom-left | 1165 "tinh," pink | 1175 comma | 1180 star blob right | 1193 moon disc rises
* 1196-1205 yellow "tinh" grey->yellow | 1210-1220 moon fades | 1211-1220 big "duyen" ghost->white | 1214 purple dot -> starburst
* 1217 "nao" | 1226 "chang" | 1237 "choi" | 1248 "voi.." | 1254 moon#2 rises | 1259-1268 "anh" (purple, ghost -> solid)
* 1272 "co" | 1279 "doi" + decor teleport (purple starburst right -> top-left) | 1290 "nhung" | 1294 yellow dot -> starburst (small) | 1305 "sao?" | 1311 "long" (yellow) | 1324 "em" (purple)
* 1330-1344 "DUONG" | 1337-1344 "NHU" | 1350 "chang" | 1356 "dua" | 1363 "den" | 1370 "moi" (tiny typed line in the starburst)
* 1372-1392 nothing new; wall coasts upward at ~2 px/f; 1393-1402 whole wall fades (all together) | 1403-1404 empty.
* Gaps between entries in the climax: 9, 13, 15, 16-20, 11, 6, 9, 11, 11, 11, 13, 7, 11, 15, 6, 13, 6, 7, 13, 6, 7, 7 (median ~10; clusters of 2-3 words at 6-7 f, then 13-15 f breath).

End card (static, diff 0)
* 1404-1410 fade-in "nguoi giau cau chao" (7 f) | hold to 1470 (60 f) | fade-out 1471-1481 (10 f)
* 1484-1491 fade-in "toi hoi tham co cay biet khong?" (7 f) | hold to 1541 (50 f) | fade-out 1541-1550 (10 f)
* 1551-1558 fade-in two-line "hoa da ve voi may gio bien khoi se co ai / noi yeu that long" (7 f) | hold to 1678 (120 f) | fade-out 1679-1692 (13 f)
* 1693-1707 empty bg, last 15 frames. Total end card = 305 f (10.2 s). Wind-down is: climax -> tiny captions -> nothing; no zoom/scale/outro motion.

Hard-cut list (second half): 861, 997, 1143 (true cuts); 1127 (1-f flash, content appears); 1279 (decor teleport). Metric cutEvents 884-975 and 1015-1085 are
NOT cuts: they are continuous high-motion scroll (diff 20-54 peaks at 885-895, 912-915, 955-965 = hero rise-ins with blur).

## Open questions / not resolved
* [?] Entry rotation of NGAY at 912-916 looks like +4..6 deg skew/lean; may be motion-blur skew, not rotation.
* [?] Whether small-word pops (trang, tung, dem) have a 1-2 f opacity ramp or a 0-f cut; at 30 fps contact sheets they look like a cut.
* [?] Spin rate of starbursts and rings is too small to measure from 240x180 cells (<3 deg/f).
* [?] The "tinh," comma flicker at 1184-1197 may be a rendering artifact of the comma overlapping a star blob.
* [?] Scroll speeds are measured from word positions in small cells; error ~ +/-25%.

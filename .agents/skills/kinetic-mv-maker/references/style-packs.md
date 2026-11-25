# Style Packs and Theme Options

## Packs

| Pack id | Reference video | Look | Default fps |
|---|---|---|---:|
| `dreamy-glow-dark` | `ref-an-ngo-dark-purple.mp4` | charcoal-purple `#1F1C22`, neon purple `#9B5CFF`, butter yellow `#FFF066`, pink `#FF5C8A`; soft star and moon blobs, outline starbursts, dotted rings, a polaroid, a rose | 30 |
| `pop-collage-light` | `ref-ca-ngay-light.mp4` | off-white `#FAFAFA` with a dark `#0D0D0F` middle section; orange `#FF4518`, violet `#6C28FF`, mint `#8FD99F`; tilted stickers, vector paper-cut flowers, hollow echo type | 30 |
| `hk-1999-halftone` | the two `_luntuyett.01_*` videos | black `#050505`, crimson `#F21B14`, cyan `#00F0FF`, white; halftone ribbons, 14-point starbursts, serif red words, wireframe `漫步 1999` | 24 |

Fonts: Anton, Oswald, Be Vietnam Pro, Noto Serif (Vietnamese subsets) with a CJK sans fallback
(Microsoft JhengHei and similar) so Han glyphs render.

## Compositions

| Id | Size | Notes |
|---|---|---|
| `KineticDynamic` | 1200x900 | duration and fps come from `props.storyboard` |
| `KineticDynamicVertical` | 1080x1920 | same, 9:16 |
| `HK1999Demo` (+Wide, +Vertical) | 1200x900 | fixed to `src/storyboards/hk1999-vn.ts`, 588 frames at 24 fps |
| `HK1999Cantonese` | 1200x900 | fixed to `src/storyboards/hk1999-2.ts`, 731 frames at 24 fps |

## Theme options (`scripts/generate-storyboard.mjs`)

Both generated styles are one scene builder plus a theme object (`DREAMY_THEME`, `POP_THEME`).

| Option | Effect |
|---|---|
| `continuous` | scenes sit near the middle, one swaying camera path, no cuts |
| `fit {halfW, halfH}` | safe area for readable text (default 400 x 300 px around the scene centre) |
| `jitter {pos, rot, size}` | seeded random scatter of every word before separation and fitting |
| `dense` | adds ghost trails (hollow copies) and small repeat captions |
| `decorOverlap` | frames that decor lives past its scene |
| `entrances`, `heroEntrances`, `entranceFrames` | entrance kinds for ordinary and large words, and their lengths |
| `exitStyle`, `softExitFrames`, `exitOpacityFloor` | how words leave (`slide-out`), and how long |
| `travel {hero, small, rot, heroGrow, smallGrow}` | movement, tilt and growth over a word's life |
| `wordDrift` | extra sway while a word is held |
| `cameraWobble`, `cameraSmoothing` | always-on camera sway and spring smoothing (`omega`, `zeta`) |
| `reserved(si, scene)` | circles that captions must avoid (pop uses it for flowers) |
| `decorate(...)` | style-specific decor: dreamy stars and moons, pop stickers and flowers |

## Entrance and exit kinds (engine)

Entrances: `slide-blur` (default: blurs in from left, right, top or bottom, stretched along the
travel axis, sharpens while settling), `char-spring` (per-letter spring with tilt), `roll-settle`,
`tilt-in`, `unfold`, `typewriter`, `blur-pop`, `hero-rise`, `fade-focus`, plus the older `pop`,
`slam`, `slide-up`, `mask-wipe`, `mask-glide`, `spring-pop`, `tracking-expand`, `flip-spin`.
Avoid per-letter or per-word clipping entrances for accented text: they cut diacritics.

Exits: `slide-out` (mirror of `slide-blur`), `fly-out`, `ease-in-pop`, mask wipes, `split-close`,
`char-peel`, `cut`.

## Graphic nodes

`starburst`, `ribbon`, `zigzag`, `progressBar`, `mediaCard`, `radialRays`, `bgOverride`,
`stickerBlock`, `hollowEcho`, `orbitRing`, `bokehField`, `flower`, `doodle` (star, moon, swirl,
butterfly), `sceneTransition`. World-space shapes are blurred-and-offset in on entry
automatically. Screen-fixed shapes with `zIndex <= 20` are drawn behind world-space text, higher
ones in front.

## FPS tiers

24, 30 or 60. Primitives scale their timing by `fps / 24`. 120 fps is disabled on purpose.
`gen:storyboard -- --fps N` retimes a reviewed `.align.json` without new ElevenLabs credits.

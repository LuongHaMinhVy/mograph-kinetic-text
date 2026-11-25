import type React from "react";
import { useMemo } from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig } from "../engine/CameraRig";
import { StageViewport } from "../engine/StageViewport";
import { sampleCamera, sampleSmoothCamera } from "../engine/easing";
import {
  BokehField,
  CircularTextRing,
  DashedOrbitRing,
  DiagonalRibbon,
  DoodleShape,
  FlowerCutout,
  HollowEchoTrail,
  KineticWord,
  MediaInset,
  PlexusField,
  PostProcessFX,
  ProgressGlowBar,
  RadialRays,
  SceneTransition,
  StarburstBadge,
  StickerBlock,
  ZigzagTrack,
} from "../engine/primitives";
import type {
  EnergyTrack,
  GraphicNode,
  Storyboard,
  StylePackConfig,
} from "../engine/types";
import { getStylePack } from "../styles";
import { ensureLegible } from "../engine/legibility";

export interface KineticMVProps {
  storyboard: Storyboard;
  energyTrack?: EnergyTrack;
}

const NO_SOFT_ENTRY = new Set([
  "bgOverride",
  "sceneTransition",
  "bokehField",
  "plexusField",
  "progressBar",
  "radialRays",
]);

/** Graphics ease in too: blurred and offset from one side, sharpening as they settle. */
function softEnter(node: GraphicNode, frame: number, fps: number, el: React.ReactNode) {
  if (NO_SOFT_ENTRY.has(node.kind) || node.startFrame <= 1) return el;
  const dur = Math.max(5, Math.round(0.3 * fps));
  const local = frame - node.startFrame;
  if (local < 0 || local >= dur) return el;
  const t = Math.min(1, (local + 0.5) / dur);
  const e = 1 - Math.pow(1 - t, 3);
  const h =
    Math.abs(Math.sin((node.startFrame * 13 + node.id.length * 7) * 12.9898) * 43758.5453) % 1;
  const dirs: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const [dx, dy] = dirs[Math.floor(h * 4) % 4];
  const dist = (1 - e) * 120;
  return (
    <div
      key={`${node.id}-soft`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: Math.min(1, e * 1.5),
        transform: `translate(${(dx * dist).toFixed(1)}px, ${(dy * dist).toFixed(1)}px)`,
        filter: `blur(${((1 - e) * 14).toFixed(1)}px)`,
      }}
    >
      {el}
    </div>
  );
}

function renderGraphicNode(
  node: GraphicNode,
  stylePack: StylePackConfig,
  frame: number,
  fps: number,
  cameraX: number,
  bassEnergy: number,
  isBeat: boolean
) {
  switch (node.kind) {
    case "starburst":
      return (
        <StarburstBadge
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
          bassEnergy={bassEnergy}
          isBeat={isBeat}
        />
      );
    case "ribbon":
      return (
        <DiagonalRibbon key={node.id} node={node} frame={frame} fps={fps} />
      );
    case "zigzag":
      return (
        <ZigzagTrack
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
        />
      );
    case "progressBar":
      return (
        <ProgressGlowBar
          key={node.id}
          node={node}
          frame={frame}
          fps={fps}
          bassEnergy={bassEnergy}
        />
      );
    case "mediaCard":
      return (
        <MediaInset
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
          cameraX={cameraX}
        />
      );
    case "radialRays":
      return (
        <RadialRays key={node.id} node={node} frame={frame} fps={fps} />
      );
    case "stickerBlock":
      return <StickerBlock key={node.id} node={node} frame={frame} fps={fps} />;
    case "hollowEcho":
      return (
        <HollowEchoTrail
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
        />
      );
    case "orbitRing":
      return (
        <DashedOrbitRing key={node.id} node={node} frame={frame} fps={fps} />
      );
    case "bokehField":
      return (
        <BokehField key={node.id} node={node} frame={frame} fps={fps} />
      );
    case "plexusField":
      return (
        <PlexusField key={node.id} node={node} frame={frame} fps={fps} />
      );
    case "circularText":
      return (
        <CircularTextRing
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
        />
      );
    case "doodle":
      return <DoodleShape key={node.id} node={node} frame={frame} fps={fps} />;
    case "flower":
      return <FlowerCutout key={node.id} node={node} frame={frame} fps={fps} />;
    case "sceneTransition":
      return (
        <SceneTransition
          key={node.id}
          node={node}
          stylePack={stylePack}
          frame={frame}
        />
      );
    case "bgOverride":
      return null;
  }
}

export const KineticMV = ({ storyboard: rawStoryboard, energyTrack }: KineticMVProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stylePack = getStylePack(rawStoryboard.stylePackId);
  // Text must never blend into its backdrop: add a contrasting halo where needed.
  const storyboard = useMemo(
    () => ensureLegible(rawStoryboard, stylePack).storyboard,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawStoryboard]
  );

  const energySample = (() => {
    if (!energyTrack || energyTrack.frames.length === 0) {
      return { bass: 0, overall: 0, isBeat: false };
    }
    const trackFps = energyTrack.fps || fps;
    const rawIdx =
      trackFps === fps ? frame : Math.round((frame / Math.max(1, fps)) * trackFps);
    const clampedIdx = Math.max(
      0,
      Math.min(energyTrack.frames.length - 1, rawIdx)
    );
    return energyTrack.frames[clampedIdx];
  })();

  const sampledCamera = storyboard.cameraSmoothing
    ? sampleSmoothCamera(storyboard.cameraKeyframes, frame, storyboard.cameraSmoothing)
    : sampleCamera(storyboard.cameraKeyframes, frame);
  const wobble = storyboard.cameraWobble;
  const wobbleT = (frame / Math.max(1, fps)) * ((Math.PI * 2) / (wobble?.periodSec ?? 2));
  const camera = wobble
    ? {
        ...sampledCamera,
        x: sampledCamera.x + Math.sin(wobbleT * 0.83 + 1.3) * wobble.panPx,
        y: sampledCamera.y + Math.cos(wobbleT * 0.61) * wobble.panPx * 0.7,
        zoom: sampledCamera.zoom * (1 + Math.sin(wobbleT * 0.7 + 0.4) * wobble.zoomPct),
        rotateDeg: sampledCamera.rotateDeg + Math.sin(wobbleT) * wobble.rotDeg,
      }
    : sampledCamera;

  const activeBgOverride = storyboard.graphics.find(
    (g) =>
      g.kind === "bgOverride" &&
      frame >= g.startFrame &&
      frame < g.endFrame
  );
  const backgroundColor =
    activeBgOverride && activeBgOverride.kind === "bgOverride"
      ? activeBgOverride.color
      : stylePack.palette.bg;

  const worldGraphics = storyboard.graphics.filter(
    (g) => g.kind !== "bgOverride" && !("screenFixed" in g && g.screenFixed)
  );
  const allFixedGraphics = storyboard.graphics.filter(
    (g) => g.kind !== "bgOverride" && "screenFixed" in g && g.screenFixed
  );
  // Low-zIndex screen-fixed shapes (chorus ribbon, bokeh) belong behind world-space text, but
  // the camera rig is its own stacking context, so they must be drawn before it.
  const isBackFixed = (g: GraphicNode) => ((g as { zIndex?: number }).zIndex ?? 10) <= 20;
  const backFixedGraphics = allFixedGraphics.filter(isBackFixed);
  const fixedGraphics = allFixedGraphics.filter((g) => !isBackFixed(g));

  const worldWords = storyboard.words.filter((w) => !w.screenFixed);
  const fixedWords = storyboard.words.filter((w) => w.screenFixed);

  const worldLayer = (
    <CameraRig
      camera={camera}
      frame={frame}
      fps={fps}
      bassEnergy={energySample.bass}
      isBeat={energySample.isBeat}
    >
      {worldGraphics.map((node) =>
        softEnter(
          node,
          frame,
          fps,
          renderGraphicNode(
            node,
            stylePack,
            frame,
            fps,
            camera.x,
            energySample.bass,
            energySample.isBeat
          )
        )
      )}
      {worldWords.map((word) => (
        <KineticWord
          key={word.id}
          node={word}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
          bassEnergy={energySample.bass}
          isBeat={energySample.isBeat}
        />
      ))}
    </CameraRig>
  );

  const screenFixedLayer = (
    <>
      {fixedGraphics.map((node) =>
        renderGraphicNode(
          node,
          stylePack,
          frame,
          fps,
          camera.x,
          energySample.bass,
          energySample.isBeat
        )
      )}
      {fixedWords.map((word) => (
        <KineticWord
          key={word.id}
          node={word}
          stylePack={stylePack}
          frame={frame}
          fps={fps}
          bassEnergy={energySample.bass}
          isBeat={energySample.isBeat}
        />
      ))}
    </>
  );

  return (
    <>
      {storyboard.audioSrc && <Audio src={staticFile(storyboard.audioSrc)} />}
      <StageViewport
        backgroundColor={backgroundColor}
        backFixedLayer={
          <>
            {backFixedGraphics.map((node) =>
              softEnter(
                node,
                frame,
                fps,
                renderGraphicNode(
                  node,
                  stylePack,
                  frame,
                  fps,
                  camera.x,
                  energySample.bass,
                  energySample.isBeat
                )
              )
            )}
          </>
        }
        worldLayer={worldLayer}
        screenFixedLayer={screenFixedLayer}
        postFxLayer={<PostProcessFX stylePack={stylePack} />}
      />
    </>
  );
};

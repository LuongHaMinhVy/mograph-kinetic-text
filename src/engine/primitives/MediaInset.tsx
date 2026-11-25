import { applyEasing, lerp } from "../easing";
import type { MediaCardGraphicNode, StylePackConfig } from "../types";

interface MediaInsetProps {
  node: MediaCardGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
  fps?: number;
  cameraX: number;
}

export const MediaInset = ({
  node,
  stylePack,
  frame,
  fps = 24,
  cameraX,
}: MediaInsetProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const popT = applyEasing(
    Math.min(1, (localFrame + 1.5 * fpsScale) / (6 * fpsScale)),
    "backOut"
  );
  const wipeE = applyEasing(
    Math.min(1, (localFrame + 1.5 * fpsScale) / (6 * fpsScale)),
    "expoOut"
  );
  const scale = lerp(0.9, 1, popT);
  let opacity = Math.min(1, (localFrame + 2 * fpsScale) / (3 * fpsScale));
  let extraY = lerp(24, 0, wipeE);
  let clipPath: string | undefined =
    wipeE < 0.999 ? `inset(0 0 ${((1 - wipeE) * 100).toFixed(1)}% 0)` : undefined;

  const exitFrames = Math.max(3, Math.round(0.18 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / exitFrames)
    );
    const easeIn = exitT * exitT;
    clipPath = `inset(${(easeIn * 100).toFixed(1)}% 0 0 0)`;
    extraY += -easeIn * 22;
    opacity *= lerp(1, 0.1, easeIn);
  }

  const parallaxShift = (node.parallaxFactor ?? 0) * (cameraX - 600);
  const rotateDeg = node.rotateDeg ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        left: node.x + parallaxShift,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex ?? 9,
        opacity,
        clipPath,
        transform: `translate(-50%, -50%) translateY(${extraY.toFixed(
          1
        )}px) rotate(${rotateDeg}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        filter: node.blurPx ? `blur(${node.blurPx}px)` : undefined,
        pointerEvents: "none",
      }}
    >
      {node.variant === "hk-ticket" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#EFE2C4",
            border: "3px solid #D4B98B",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.65)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10px 14px",
            boxSizing: "border-box",
            fontFamily: stylePack.fonts.serif,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(180,25,20,0.08) 0px, rgba(180,25,20,0.08) 1px, transparent 1px, transparent 5px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #B5231C",
              paddingBottom: 4,
              color: "#B5231C",
              fontSize: Math.max(12, node.height * 0.11),
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            <span>香港 1999</span>
            <span>NO.03</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#A31B14",
            }}
          >
            <span
              style={{
                fontSize: Math.max(24, node.height * 0.34),
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: stylePack.fonts.display,
              }}
            >
              {node.label ?? "3"}
            </span>
            <div
              style={{
                textAlign: "right",
                fontSize: Math.max(10, node.height * 0.095),
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              <div>KOWLOON</div>
              <div>TRAMWAY</div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px dashed #B5231C",
              paddingTop: 4,
              display: "flex",
              justifyContent: "space-between",
              color: "#4B1713",
              fontSize: Math.max(9, node.height * 0.08),
              fontWeight: 700,
            }}
          >
            <span>CENTRAL - SHAU KEI WAN</span>
            <span>1999</span>
          </div>
        </div>
      )}

      {node.variant === "hk-neon-sign" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#141010",
            border: "2px solid #3D201D",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.72)",
            padding: "12px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              border: "2px solid #F2A83B",
              padding: "6px 10px",
              color: "#FFD27A",
              backgroundColor: "rgba(180, 28, 16, 0.28)",
              fontFamily: stylePack.fonts.displayNarrow,
              fontSize: Math.max(14, node.height * 0.13),
              fontWeight: 700,
              letterSpacing: "0.08em",
              textShadow: "0 0 8px rgba(242, 168, 59, 0.75)",
            }}
          >
            {node.label ?? "VICTORIA PARTS CO. LTD"}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                border: "2px solid #F2241B",
                padding: "8px 6px",
                textAlign: "center",
                color: "#FFE7C2",
                fontFamily: stylePack.fonts.serif,
                fontSize: Math.max(18, node.height * 0.18),
                fontWeight: 700,
                textShadow: "0 0 10px #F2241B",
              }}
            >
              謝漢茶室
            </div>
            <div
              style={{
                width: "34%",
                border: "2px solid #00F0FF",
                padding: "8px 4px",
                textAlign: "center",
                color: "#B8FCFF",
                fontFamily: stylePack.fonts.serif,
                fontSize: Math.max(14, node.height * 0.14),
                fontWeight: 700,
                textShadow: "0 0 8px #00F0FF",
              }}
            >
              香港夜
            </div>
          </div>
          <div
            style={{
              fontFamily: stylePack.fonts.body,
              fontSize: Math.max(10, node.height * 0.085),
              color: "#D46A5E",
              letterSpacing: "0.14em",
              textAlign: "right",
            }}
          >
            MONG KOK 1999
          </div>
        </div>
      )}

      {node.variant === "fire-square" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#1C0402",
            border: "1px solid rgba(255, 110, 40, 0.65)",
            boxShadow: "0 0 24px rgba(242, 36, 27, 0.6)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-15%",
              backgroundImage:
                "radial-gradient(circle at 38% 42%, #FFF3A1 0%, #FF7700 32%, #D9160C 66%, transparent 90%), radial-gradient(circle at 72% 68%, #FFBD38 0%, transparent 45%)",
              filter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)",
            }}
          />
        </div>
      )}

      {node.variant === "polaroid-frame" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#F8F7F4",
            padding: "8%",
            boxSizing: "border-box",
            boxShadow: "0 14px 30px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "6%",
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundImage:
                "linear-gradient(150deg, #2D2338 0%, #583C66 55%, #D99B66 100%)",
            }}
          />
          {node.label && (
            <div
              style={{
                fontFamily: stylePack.fonts.body,
                fontSize: Math.max(10, node.height * 0.08),
                color: "#222222",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {node.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

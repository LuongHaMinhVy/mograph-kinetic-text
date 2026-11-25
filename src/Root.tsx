import type { ComponentType } from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { KineticMV, type KineticMVProps } from "./compositions/KineticMV";
import type { EnergyTrack } from "./engine/types";
import { hk1999VnStoryboard } from "./storyboards/hk1999-vn";
import hk1999EnergyJson from "./storyboards/hk1999-vn.energy.json";
import { hk1999CantoneseStoryboard } from "./storyboards/hk1999-2";
import hk1999CantoneseEnergyJson from "./storyboards/hk1999-2.energy.json";

const hk1999EnergyTrack = hk1999EnergyJson as EnergyTrack;
const hk1999CantoneseEnergyTrack = hk1999CantoneseEnergyJson as EnergyTrack;

const TypedKineticMV = KineticMV as unknown as ComponentType<
  Record<string, unknown>
>;

const resolveDynamicMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = ({ props }) => {
  const typed = props as Partial<KineticMVProps>;
  const sb = typed?.storyboard;
  return {
    durationInFrames: sb?.durationInFrames ?? hk1999VnStoryboard.durationInFrames,
    fps: sb?.fps ?? hk1999VnStoryboard.fps,
  };
};

export const RemotionRoot = () => {
  const defaultProps: KineticMVProps = {
    storyboard: hk1999VnStoryboard,
    energyTrack: hk1999EnergyTrack,
  };

  return (
    <>
      <Composition
        id="HK1999Demo"
        component={TypedKineticMV}
        durationInFrames={hk1999VnStoryboard.durationInFrames}
        fps={hk1999VnStoryboard.fps}
        width={1200}
        height={900}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="HK1999Cantonese"
        component={TypedKineticMV}
        durationInFrames={hk1999CantoneseStoryboard.durationInFrames}
        fps={hk1999CantoneseStoryboard.fps}
        width={1200}
        height={900}
        defaultProps={
          {
            storyboard: hk1999CantoneseStoryboard,
            energyTrack: hk1999CantoneseEnergyTrack,
          } as unknown as Record<string, unknown>
        }
      />
      <Composition
        id="HK1999DemoWide"
        component={TypedKineticMV}
        durationInFrames={hk1999VnStoryboard.durationInFrames}
        fps={hk1999VnStoryboard.fps}
        width={1920}
        height={1080}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="HK1999DemoVertical"
        component={TypedKineticMV}
        durationInFrames={hk1999VnStoryboard.durationInFrames}
        fps={hk1999VnStoryboard.fps}
        width={1080}
        height={1920}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="KineticDynamic"
        component={TypedKineticMV}
        durationInFrames={hk1999VnStoryboard.durationInFrames}
        fps={hk1999VnStoryboard.fps}
        width={1200}
        height={900}
        calculateMetadata={resolveDynamicMetadata}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="KineticDynamicVertical"
        component={TypedKineticMV}
        durationInFrames={hk1999VnStoryboard.durationInFrames}
        fps={hk1999VnStoryboard.fps}
        width={1080}
        height={1920}
        calculateMetadata={resolveDynamicMetadata}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
    </>
  );
};

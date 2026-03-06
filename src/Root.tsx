import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { VIDEO_DURATION_FRAMES, VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./video-config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SubtitleReel"
        component={MyComposition}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};

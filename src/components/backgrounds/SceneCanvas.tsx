"use client";

import { forwardRef } from "react";
import { MotionBackground, type MotionBackgroundHandle } from "@/components/MotionBackground";
import type { DaybookPreferences } from "@/types/quote";

export const SceneCanvas = forwardRef<MotionBackgroundHandle, { preferences: DaybookPreferences }>(function SceneCanvas({ preferences }, ref) {
  return (
    <div className="scene-layer" aria-hidden="true">
      <MotionBackground ref={ref} animation={preferences.backgroundAnimation} interaction={preferences.backgroundInteraction} quality={preferences.graphicsQuality} />
      <div className="scene-vignette" />
      <div className="scene-grain" />
    </div>
  );
});

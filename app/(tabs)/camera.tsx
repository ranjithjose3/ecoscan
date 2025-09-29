// app/(tabs)/camera.tsx
import React from "react";
import ScreenLayout from "../../components/ScreenLayout";
import EcoScanCard from "../../components/EcoScanCard"; // 👈 make sure path is correct

export default function CameraScreen() {
  return (
    <ScreenLayout
      title="Camera"
      subtitle="Capture and upload eco-friendly moments"
      scrollable={false}
      contentStyle={{ paddingHorizontal: 1, paddingVertical: 0 }}
    >
      <EcoScanCard />
    </ScreenLayout>
  );
}

// app/(tabs)/camera.tsx
import React from "react";
import ScreenLayout from "../../components/ScreenLayout";
import EcoScanCard from "../../components/EcoScanCard"; // 👈 make sure path is correct
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CameraScreen() {
  const insets = useSafeAreaInsets();

  return (
    
    <ScreenLayout
      title="Camera"
      subtitle="Capture and upload eco-friendly moments"
      scrollable={true}
      contentStyle={{ paddingHorizontal: 1, paddingVertical: 4, paddingBottom: insets.bottom + 40, }}
    >
      <EcoScanCard />
    </ScreenLayout>
  );
}

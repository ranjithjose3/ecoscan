import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import EcoScanInfoCard from "./ecoscan/EcoScanInfoCard";
import EcoScanPreviewCard from "./ecoscan/EcoScanPreviewCard";
import EcoScanResultCard from "./ecoscan/EcoScanResultCard";
import { EcoScanService } from "../services/EcoScanService";
import MovableFAB from "./MovableFAB";
import { FAB, useTheme } from "react-native-paper";

export default function EcoScanCard() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
   const theme = useTheme();
  const handleCapture = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
        alert("Camera permission required");
        return;
    }

    const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,   // 👈 forces crop UI
        aspect: [1, 1],        // 👈 restricts to square
    });

    if (!result.canceled && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
    }
    };


  const handleCancel = () => {
    setPhoto(null);
    setResult(null);
  };

  const handleSend = async () => {
    if (!photo) return;
    try {
      setLoading(true);
      const data = await EcoScanService.analyzeImage(photo);
      setResult(data);
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async () => {
    setResult(null);
    setPhoto(null);
  };

  // Decide which card to show
  if (result) {
    return (
      <>
        <EcoScanResultCard result={result} onRescan={handleRescan} />

        {/* Floating Rescan Button */}
       <MovableFAB onPress={handleRescan} />
      </>
    );
  }

  if (photo) {
    return (
      <EcoScanPreviewCard
        photo={photo}
        onCancel={handleCancel}
        onSend={handleSend}
        loading={loading}
      />
    );
  }
  return <EcoScanInfoCard onCapture={handleCapture} />;
}

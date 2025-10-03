import * as ImageManipulator from "expo-image-manipulator";

export type EcoScanResult = {
  objects: {
    [key: string]: string;
    waste_classification: string;
    special_instruction: string;
  }[];
  output_image: string;
};

const API_URL = "https://8eb2d33b61a5.ngrok-free.app/detect-image/";

export const EcoScanService = {
  /**
   * Convert captured image URI → Base64
   */
  async imageToBase64(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // resize for bandwidth
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (!result.base64) {
      throw new Error("No base64 generated");
    }
    return result.base64;
  },

  /**
   * Send Base64 image to backend API
   */
  async analyzeImage(uri: string): Promise<EcoScanResult> {
    const base64 = await this.imageToBase64(uri);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_b64: base64 }),
    });

     console.log("Raw response status:", response);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

     const data = await response.json();

     const { output_image, ...rest } = data;
    console.log("API response JSON (without image):", rest);

    return data as EcoScanResult;
  },
};

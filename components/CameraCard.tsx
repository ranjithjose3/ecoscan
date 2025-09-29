import React, { useState } from "react";
import { StyleSheet, Image, View } from "react-native";
import { Card, Text, Button, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";

interface EcoScanCardProps {
  onSend?: (uri: string) => void;
}

export default function EcoScanCard({ onSend }: EcoScanCardProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const theme = useTheme();

  const handleCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleCancel = () => setPhoto(null);

  const handleSend = () => {
    if (photo && onSend) onSend(photo);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      {!photo ? (
        <View>
          <Card.Title title="EcoScan AI" />
          <Card.Content>
            <Text variant="bodyMedium">
              Place your item clearly in the frame and capture an image. Our AI
              will analyze it instantly.
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button mode="contained" onPress={handleCapture} style={{ flex: 1 }}>
              Capture
            </Button>
          </Card.Actions>
        </View>
      ) : (
        <View>
          <Image source={{ uri: photo }} style={styles.image} />
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              textColor={theme.colors.secondary}
              style={{ flex: 1, marginRight: 8 }}
              onPress={handleCancel}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              style={{ flex: 1 }}
              onPress={handleSend}
            >
              Send
            </Button>
          </Card.Actions>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 0,
    padding: 0,
    borderRadius: 0,
    overflow: "hidden",
  },
  actions: {
    justifyContent: "space-between",
    padding: 8,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: "cover",
  },
});

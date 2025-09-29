import React from "react";
import { StyleSheet, Image, View } from "react-native";
import { Card, Button, useTheme } from "react-native-paper";

interface PreviewProps {
  photo: string;
  onCancel: () => void;
  onSend: () => void;
  loading?: boolean;
}

export default function EcoScanPreviewCard({ photo, onCancel, onSend, loading }: PreviewProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Image source={{ uri: photo }} style={styles.image} />
      <Card.Actions style={styles.actions}>
        <Button
          mode="outlined"
          textColor={theme.colors.secondary}
          style={{ flex: 1, marginRight: 8 }}
          onPress={onCancel}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          style={{ flex: 1 }}
          onPress={onSend}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 0, padding: 0, borderRadius: 0, overflow: "hidden" },
  actions: { justifyContent: "space-between", padding: 8 },
  image: { width: "100%", aspectRatio: 1, resizeMode: "cover" },
});

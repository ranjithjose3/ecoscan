import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";

interface InfoProps {
  onCapture: () => void;
}

export default function EcoScanInfoCard({ onCapture }: InfoProps) {
  return (
    <Card style={styles.card}>
      <Card.Title title="EcoScan AI" />
      <Card.Content>
        <Text variant="bodyMedium">
          Place your item clearly in the frame and capture an image. Our AI will analyze it instantly.
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button mode="contained" onPress={onCapture} style={{ flex: 1 }}>
          Capture
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 4,marginBottom:4,padding: 0, borderRadius: 0, overflow: "hidden" },
  actions: { justifyContent: "space-between", padding: 8 },
});

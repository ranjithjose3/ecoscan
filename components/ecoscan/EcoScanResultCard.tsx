import React from "react";
import { StyleSheet, Image, ScrollView } from "react-native";
import { Card, Text, IconButton, useTheme, List,FAB, Button  } from "react-native-paper";

interface EcoScanResultCardProps {
  result: any;
  onRescan: () => void;
}

export default function EcoScanResultCard({ result, onRescan }: EcoScanResultCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      {/* Image */}
      <Image
        source={{ uri: `data:image/jpeg;base64,${result.output_image}` }}
        style={styles.image}
      />

      {/* Results */}
      <Card.Content>
        <Text
          variant="titleLarge"
          style={[styles.sectionTitle, { color: theme.colors.primary }]}
        >
          Detected Objects
        </Text>
        <ScrollView style={{ flexGrow: 1 }}>
          <List.AccordionGroup>
            {result.objects.map((obj: any, index: number) => (
              <List.Accordion
                key={index}
                id={index.toString()} // required for group
                title={obj[`ITEM ${index + 1}`]}
                titleStyle={styles.itemTitle}
              >
                <List.Item
                  title={`Classification: ${obj.waste_classification}`}
                  description={`Instruction: ${obj.special_instruction}`}
                  titleNumberOfLines={2}
                  descriptionNumberOfLines={4}
                  style={styles.itemContent}
                />
              </List.Accordion>
            ))}
          </List.AccordionGroup>
        </ScrollView>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          onPress={onRescan}
          style={{ flex: 1 }}
        >
          Rescan
        </Button>
      </Card.Actions>
      

      {/* Floating Re-scan Button */}
      
      
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 2,
    marginBottom: 16,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: "cover",
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "700",
  },
  itemTitle: {
    fontWeight: "700",
  },
  itemContent: {
    paddingLeft: 16,
  },
  rescanButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 28,
    elevation: 5,
  },
});

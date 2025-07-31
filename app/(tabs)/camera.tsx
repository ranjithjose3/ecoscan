import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import ScreenLayout from '../../components/ScreenLayout'; // ✅ Reusable layout

export default function CameraScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const theme = useTheme();

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <ScreenLayout
      title="Camera"
      subtitle="Capture and upload eco-friendly moments"
      contentStyle={styles.content}
    >
      <Button mode="contained" onPress={takePhoto}>
        Take Photo
      </Button>
      {photo && (
        <Image
          source={{ uri: photo }}
          style={[styles.image, { borderColor: theme.colors.primary }]}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderWidth: 2,
    borderRadius: 8,
  },
});

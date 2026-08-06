import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

const API_URL = 'http://192.168.1.79:8000';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
  face_folder: string;
};

type FaceLoginProps = {
  onLoginSuccess: (user: User) => void;
};

export default function FaceLogin({
  onLoginSuccess,
}: FaceLoginProps) {
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] =
    useCameraPermissions();

  const [isProcessing, setIsProcessing] =
    useState(false);

  const loginWithFace = async () => {
    if (!cameraRef.current) {
      Alert.alert(
        'Error',
        'La cámara todavía no está lista.',
      );

      return;
    }

    try {
      setIsProcessing(true);

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

      if (!photo?.uri) {
        throw new Error(
          'No se pudo tomar la fotografía.',
        );
      }

      const formData = new FormData();

      formData.append(
        'file',
        {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'login_face.jpg',
        } as any,
      );

      const response = await fetch(
        `${API_URL}/auth/login-face`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'El rostro no fue reconocido.',
        );
      }

      Alert.alert(
        'Inicio de sesión correcto',
        `Bienvenido, ${data.user.name}`,
      );

      onLoginSuccess(data.user);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      Alert.alert(
        'No se pudo iniciar sesión',
        message,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.permissionText}>
          Revisando permisos de cámara...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>
          Inicio de sesión facial
        </Text>

        <Text style={styles.permissionText}>
          Necesitamos permiso para utilizar la
          cámara frontal.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Conceder permiso
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>
            Inicio de sesión facial
          </Text>

          <View style={styles.faceGuide} />

          <Text style={styles.instructions}>
            Coloca tu rostro dentro del recuadro,
            mira hacia la cámara y procura tener
            buena iluminación.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              isProcessing &&
                styles.disabledButton,
            ]}
            onPress={loginWithFace}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                Iniciar sesión con mi rostro
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  title: {
    marginBottom: 25,
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  faceGuide: {
    width: 260,
    height: 330,
    marginBottom: 25,
    borderWidth: 4,
    borderColor: '#ffffff',
    borderRadius: 150,
  },

  instructions: {
    marginBottom: 25,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },

  permissionText: {
    marginBottom: 20,
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
  },

  button: {
    minWidth: 260,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#7a4b2a',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
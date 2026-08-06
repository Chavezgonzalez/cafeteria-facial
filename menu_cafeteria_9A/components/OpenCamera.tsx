import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App() {
  const [userName, setUserName] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStartProcess = () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre de usuario primero.');
      return;
    }
    setIsCapturing(true);
    setStatusText('Iniciando cámara...');

    setTimeout(() => {
      startAutomaticCapture();
    }, 500);
  };

  const startAutomaticCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'No hay una referencia a la cámara.');
      setIsCapturing(false);
      return;
    }

    const capturedUris: string[] = [];

    try {
      for (let i = 1; i <= 30; i++) {
        setStatusText(`Capturando imagen ${i} de 30...`);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });

        if (photo?.uri) {
          capturedUris.push(photo.uri);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setStatusText('¡Captura finalizada! Subiendo al servidor...');
      await uploadToServer(capturedUris);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `Ocurrió un error durante la captura: ${errorMessage}`);
      setIsCapturing(false);
    }
  };

  const uploadToServer = async (uris: string[]) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('user_name', userName);

    uris.forEach((uri: string, index: number) => {
      formData.append('files', {
        uri: uri,
        type: 'image/jpeg',
        name: `auto_img_${index + 1}.jpg`,
      } as any);
    });

    try {
      const response = await fetch('http://192.168.1.79:8000/upload-dataset/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('¡Éxito!', data.message);
      } else {
        Alert.alert('Error', data.detail || 'Error al subir las imágenes');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red';
      Alert.alert('Error de red', errorMessage);
    } finally {
      setIsUploading(false);
      setIsCapturing(false);
      setStatusText('');
    }
  };

  return (
    <View style={styles.container}>
      {!isCapturing ? (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombre de la clase (Usuario):</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="ej: usuario_1"
          />
          <TouchableOpacity style={styles.button} onPress={handleStartProcess}>
            <Text style={styles.buttonText}>Iniciar Captura Automática (30 fotos)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing="front">
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" style={{ marginBottom: 20 }} />
              <Text style={styles.statusText}>{statusText}</Text>
              <Text style={styles.subText}>Por favor, mantén el rostro frente a la cámara y mueve ligeramente el ángulo.</Text>
            </View>
          </CameraView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  formContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 20, borderRadius: 8, backgroundColor: '#f9f9f9' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusText: { color: '#fff', fontSize: 20, textAlign: 'center', fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#ddd', fontSize: 14, textAlign: 'center' }
});
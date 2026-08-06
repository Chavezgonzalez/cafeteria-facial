import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FaceLogin from './components/FaceLogin';
import OpenCamera from './components/OpenCamera';
import ProductMenu from './components/ProductMenu';
import OrderHistory from './components/OrderHistory';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
  face_folder: string;
};

type Screen =
  | 'home'
  | 'register'
  | 'login'
  | 'menu'
  | 'history';

export default function App() {
  const [screen, setScreen] =
    useState<Screen>('home');

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setScreen('menu');
  };

  const logout = () => {
    setCurrentUser(null);
    setScreen('home');
  };

  if (screen === 'register') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.backButtonText}>
            ← Regresar
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <OpenCamera />
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.backButtonText}>
            ← Regresar
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <FaceLogin
            onLoginSuccess={handleLoginSuccess}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'history' && currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <OrderHistory
          userId={currentUser.id}
          userName={currentUser.name}
          onBack={() => setScreen('menu')}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'menu' && currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <ProductMenu
          userId={currentUser.id}
          userName={currentUser.name}
          userBalance={currentUser.balance}
          onLogout={logout}
          onOpenHistory={() =>
            setScreen('history')
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.homeContainer}>
      <Text style={styles.appTitle}>
        Cafetería Escolar
      </Text>

      <Text style={styles.subtitle}>
        Accede utilizando reconocimiento facial
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setScreen('login')}
      >
        <Text style={styles.buttonText}>
          Iniciar sesión con mi rostro
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setScreen('register')}
      >
        <Text style={styles.buttonText}>
          Registrar nuevo rostro
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    flex: 1,
  },

  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },

  backButtonText: {
    color: '#7a4b2a',
    fontSize: 16,
    fontWeight: 'bold',
  },

  homeContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#f5eee8',
  },

  appTitle: {
    marginBottom: 12,
    color: '#59341f',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    marginBottom: 45,
    color: '#604c40',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },

  primaryButton: {
    marginBottom: 16,
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#7a4b2a',
  },

  secondaryButton: {
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#ad744d',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
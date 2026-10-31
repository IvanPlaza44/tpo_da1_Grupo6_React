import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    biometricEnabled,
    hasBiometricSession,
    loginWithBiometrics,
  } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresá tu correo y contraseña.');
      return;
    }

    try {
      const userData = await login(email.trim(), password);
      Alert.alert('¡Bienvenido!', `Sesión iniciada como ${userData.email}`);
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'Usuario o contraseña incorrectos';
      Alert.alert('Error al ingresar', msg);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometrics();
    } catch (error) {
      Alert.alert('Error biométrico', error.message || 'No se pudo iniciar sesión con biometría.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.eyeButton}
          hitSlop={8}
        >
          <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Ingresar" onPress={handleLogin} />
      </View>

      {biometricEnabled && hasBiometricSession && (
        <View style={styles.buttonContainer}>
          <Button
            title="Ingresar con Huella / Rostro"
            onPress={handleBiometricLogin}
            color="#059669"
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Crear cuenta nueva"
          onPress={() => navigation.navigate('Register')}
        />
      </View>

      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotLink}
      >
        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingLeft: 12,
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  forgotLink: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;

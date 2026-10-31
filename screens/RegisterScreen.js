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
import api from '../services/api';

export const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completá tu email y contraseña.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/auth/registro', {
        usernameOrEmail: email.trim(),
        password,
      });

      await api.post('/api/auth/otp/solicitar', {
        email: email.trim(),
      });

      setStep(2);
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo completar el registro';
      console.error('Error en registro / solicitud de OTP:', error.response?.data || error.message);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresá el código OTP.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/auth/otp/verificar', {
        email: email.trim(),
        codigo: otp.trim(),
      });

      Alert.alert('¡Cuenta verificada!', 'Tu código OTP fue validado con éxito.');
      navigation.navigate('Login');
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        'Código OTP inválido o expirado';
      console.error('Error al verificar OTP:', error.response?.data || error.message);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <>
          <Text style={styles.title}>Crear Cuenta</Text>

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

          <Button
            title={submitting ? 'Enviando...' : 'Registrarse'}
            onPress={handleRegister}
            disabled={submitting}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Verificar Código OTP</Text>

          <TextInput
            style={styles.input}
            placeholder="Código OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <Button
            title={submitting ? 'Verificando...' : 'Confirmar Código'}
            onPress={handleConfirmOtp}
            disabled={submitting}
          />
        </>
      )}
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
});

export default RegisterScreen;

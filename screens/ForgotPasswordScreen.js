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
import {
  solicitarRecuperacionPassword,
  reenviarRecuperacionPassword,
  restablecerPassword,
} from '../services/auth';

export const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSolicitarCodigo = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresá tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      await solicitarRecuperacionPassword(email);
      Alert.alert(
        'Código enviado',
        'Si el correo está registrado, recibirás un código de verificación.'
      );
      setStep(2);
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudo enviar el código de recuperación.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    try {
      setLoading(true);
      await reenviarRecuperacionPassword(email);
      Alert.alert('Código reenviado', 'Se envió un nuevo código a tu correo electrónico.');
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudo reenviar el código.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinuarPaso3 = () => {
    if (!codigo.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresá el código recibido.');
      return;
    }
    setStep(3);
  };

  const handleRestablecerPassword = async () => {
    if (!passwordNueva.trim() || !confirmarPassword.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completá y confirmá la nueva contraseña.');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await restablecerPassword({
        email,
        codigo,
        passwordNueva,
      });

      Alert.alert(
        '¡Contraseña actualizada!',
        'Tu contraseña se restableció correctamente. Ya podés iniciar sesión.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'El código es inválido o expiró.';
      Alert.alert('Error al restablecer', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresá tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Enviando...' : 'Enviar código'}
              onPress={handleSolicitarCodigo}
              disabled={loading}
            />
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Ingresar Código</Text>
          <Text style={styles.subtitle}>
            Ingresá el código OTP que enviamos a {email}.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Código de verificación"
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Continuar"
              onPress={handleContinuarPaso3}
              disabled={loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Reenviando...' : 'Reenviar código'}
              onPress={handleReenviarCodigo}
              disabled={loading}
              color="#6b7280"
            />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>Nueva Contraseña</Text>
          <Text style={styles.subtitle}>
            Definí tu nueva contraseña para la cuenta {email}.
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nueva contraseña"
              value={passwordNueva}
              onChangeText={setPasswordNueva}
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmar nueva contraseña"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.eyeButton}
              hitSlop={8}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              onPress={handleRestablecerPassword}
              disabled={loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Volver al paso anterior"
              onPress={() => setStep(2)}
              disabled={loading}
              color="#6b7280"
            />
          </View>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
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
});

export default ForgotPasswordScreen;

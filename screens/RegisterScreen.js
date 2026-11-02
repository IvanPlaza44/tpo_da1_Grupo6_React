import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from '../config';
import api from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function evaluarFortalezaPassword(password) {
  if (!password) {
    return { nivel: 0, etiqueta: 'Sin ingresar', color: '#d1d5db', porcentaje: '0%' };
  }

  let puntos = 0;
  if (password.length >= 6) puntos += 1;
  if (password.length >= 8) puntos += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) puntos += 1;
  if (/[^A-Za-z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) {
    puntos += 1;
  }

  if (puntos <= 1) {
    return { nivel: 1, etiqueta: 'Débil', color: '#dc2626', porcentaje: '33%' };
  }
  if (puntos <= 2) {
    return { nivel: 2, etiqueta: 'Media', color: '#f59e0b', porcentaje: '66%' };
  }
  return { nivel: 3, etiqueta: 'Fuerte', color: '#16a34a', porcentaje: '100%' };
}

function RequisitoItem({ cumplido, texto }) {
  return (
    <View style={styles.requisitoFila}>
      <View
        style={[
          styles.requisitoCirculo,
          cumplido ? styles.requisitoCirculoOk : styles.requisitoCirculoPendiente,
        ]}
      >
        <Text
          style={[
            styles.requisitoIcono,
            cumplido ? styles.requisitoIconoOk : styles.requisitoIconoPendiente,
          ]}
        >
          {cumplido ? '✓' : '•'}
        </Text>
      </View>
      <Text
        style={[
          styles.requisitoTexto,
          cumplido ? styles.requisitoTextoOk : styles.requisitoTextoPendiente,
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

export const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const emailLimpio = email.trim();
  const emailValido = EMAIL_REGEX.test(emailLimpio);
  const largoMinimo = password.length >= 6;
  const tieneLetraYNumero = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsCoinciden =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const fortaleza = evaluarFortalezaPassword(password);

  const handleRegister = async () => {
    if (!emailLimpio || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completá tu correo electrónico y contraseña.');
      return;
    }

    if (!emailValido) {
      Alert.alert('Correo inválido', 'Ingresá una dirección de correo electrónico válida.');
      return;
    }

    if (!largoMinimo) {
      Alert.alert(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verificá que ambas contraseñas sean iguales.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/auth/registro', {
        usernameOrEmail: emailLimpio,
        password,
      });

      await api.post('/api/auth/otp/solicitar', {
        email: emailLimpio,
      });

      setCooldown(60);
      setStep(2);
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo completar el registro';
      console.error('Error en registro / solicitud de OTP:', error.response?.data || error.message);
      Alert.alert('Error en el registro', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;

    try {
      setResending(true);
      await api.post('/api/auth/otp/reenviar', {
        email: emailLimpio,
      });
      setCooldown(60);
      Alert.alert(
        'Código reenviado',
        `Enviamos un nuevo código de verificación a ${emailLimpio}.`
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudo reenviar el código OTP.';
      Alert.alert('Error al reenviar', msg);
    } finally {
      setResending(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresá el código OTP recibido.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/auth/otp/verificar', {
        email: emailLimpio,
        codigo: otp.trim(),
      });

      Alert.alert(
        '¡Cuenta verificada!',
        'Tu cuenta fue activada con éxito. Ya podés iniciar sesión.',
        [{ text: 'Ir a Iniciar Sesión', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'Código OTP inválido o expirado';
      console.error('Error al verificar OTP:', error.response?.data || error.message);
      Alert.alert('Código inválido', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado de marca */}
        <View style={styles.headerContainer}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>{step === 1 ? '✨' : '🔐'}</Text>
          </View>
          <Text style={styles.title}>
            {step === 1 ? 'Creá tu cuenta en Hallado' : 'Verificá tu correo'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Sumate a la comunidad para reportar y recuperar objetos perdidos en tu barrio.'
              : 'Ingresá el código de seguridad que generamos para activar tu cuenta.'}
          </Text>
        </View>

        {/* Indicador visual de pasos */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepCircleTextActive}>{step > 1 ? '✓' : '1'}</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Tus datos</Text>
          </View>

          <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step === 2 && styles.stepCircleActive]}>
              <Text
                style={[
                  styles.stepCircleText,
                  step === 2 && styles.stepCircleTextActive,
                ]}
              >
                2
              </Text>
            </View>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
              Código OTP
            </Text>
          </View>
        </View>

        {/* Tarjeta principal */}
        <View style={styles.card}>
          {step === 1 ? (
            <>
              {/* Campo de Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                    email.length > 0 && !emailValido && styles.inputWrapperError,
                  ]}
                >
                  <Text style={styles.inputPrefix}>✉️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="nombre@ejemplo.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {email.length > 0 && (
                    <Text style={styles.validationBadge}>
                      {emailValido ? '✅' : '⚠️'}
                    </Text>
                  )}
                </View>
                {email.length > 0 && !emailValido && (
                  <Text style={styles.helperError}>
                    Ingresá un formato de correo válido (ej: usuario@dominio.com)
                  </Text>
                )}
              </View>

              {/* Campo de Contraseña */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Contraseña</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.inputPrefix}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Creá una contraseña segura"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
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

                {/* Barra de fortaleza */}
                {password.length > 0 && (
                  <View style={styles.strengthBox}>
                    <View style={styles.strengthHeader}>
                      <Text style={styles.strengthTitle}>Seguridad de la clave:</Text>
                      <Text style={[styles.strengthValue, { color: fortaleza.color }]}>
                        {fortaleza.etiqueta}
                      </Text>
                    </View>
                    <View style={styles.strengthTrack}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: fortaleza.porcentaje,
                            backgroundColor: fortaleza.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Campo de Confirmar Contraseña */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirmar contraseña</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                    confirmPassword.length > 0 &&
                      !passwordsCoinciden &&
                      styles.inputWrapperError,
                  ]}
                >
                  <Text style={styles.inputPrefix}>🛡️</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Repetí tu contraseña"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Text style={styles.eyeText}>
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Checklist de requisitos */}
              <View style={styles.requisitosBox}>
                <Text style={styles.requisitosTitulo}>Requisitos de la cuenta:</Text>
                <RequisitoItem
                  cumplido={emailValido}
                  texto="Correo electrónico con formato válido"
                />
                <RequisitoItem
                  cumplido={largoMinimo}
                  texto="Al menos 6 caracteres de longitud"
                />
                <RequisitoItem
                  cumplido={tieneLetraYNumero}
                  texto="Combina letras y números (recomendado)"
                />
                <RequisitoItem
                  cumplido={passwordsCoinciden}
                  texto="Ambas contraseñas coinciden"
                />
              </View>

              {/* Botón principal de Registro */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  submitting && styles.primaryButtonDisabled,
                  pressed && !submitting && styles.primaryButtonPressed,
                ]}
                onPress={handleRegister}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.primaryButtonText}>Creando cuenta...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Continuar y recibir código</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {/* Tarjeta informativa del email en el Paso 2 */}
              <View style={styles.emailPill}>
                <View style={styles.emailPillInfo}>
                  <Text style={styles.emailPillLabel}>Código enviado a:</Text>
                  <Text style={styles.emailPillValue} numberOfLines={1}>
                    {emailLimpio}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setOtp('');
                    setStep(1);
                  }}
                  style={styles.changeEmailBtn}
                >
                  <Text style={styles.changeEmailText}>Cambiar</Text>
                </Pressable>
              </View>

              {/* Input de Código OTP */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Código de verificación (OTP)</Text>
                <TextInput
                  style={[
                    styles.otpInput,
                    focusedField === 'otp' && styles.inputWrapperFocused,
                  ]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9ca3af"
                  value={otp}
                  onChangeText={setOtp}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={8}
                  textAlign="center"
                />
                <Text style={styles.otpHint}>
                  Revisá tu bandeja de entrada o carpeta de spam e ingresá el código numérico.
                </Text>
              </View>

              {/* Botón Confirmar OTP */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  submitting && styles.primaryButtonDisabled,
                  pressed && !submitting && styles.primaryButtonPressed,
                ]}
                onPress={handleConfirmOtp}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.primaryButtonText}>Verificando código...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Confirmar y activar cuenta</Text>
                )}
              </Pressable>

              {/* Botón Reenviar OTP con temporizador */}
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (cooldown > 0 || resending) && styles.secondaryButtonDisabled,
                  pressed && cooldown === 0 && !resending && styles.secondaryButtonPressed,
                ]}
                onPress={handleResendOtp}
                disabled={cooldown > 0 || resending}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    (cooldown > 0 || resending) && styles.secondaryButtonTextDisabled,
                  ]}
                >
                  {resending
                    ? 'Reenviando código...'
                    : cooldown > 0
                    ? `Reenviar código en ${cooldown}s`
                    : '¿No recibiste el código? Reenviar'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Footer para volver al Login */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>¿Ya tenés una cuenta en Hallado?</Text>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={styles.footerLink}>Iniciá sesión acá</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  brandIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  stepCircleTextActive: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepLabelActive: {
    color: COLORS.text,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 12,
    maxWidth: 60,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
  },
  inputPrefix: {
    fontSize: 16,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: COLORS.text,
  },
  validationBadge: {
    fontSize: 14,
    marginLeft: 6,
  },
  helperError: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 2,
  },
  eyeButton: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  strengthBox: {
    marginTop: 4,
    gap: 4,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthTitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  requisitosBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  requisitosTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  requisitoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requisitoCirculo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requisitoCirculoOk: {
    backgroundColor: '#dcfce7',
  },
  requisitoCirculoPendiente: {
    backgroundColor: '#e5e7eb',
  },
  requisitoIcono: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  requisitoIconoOk: {
    color: '#15803d',
  },
  requisitoIconoPendiente: {
    color: '#6b7280',
  },
  requisitoTexto: {
    fontSize: 12,
  },
  requisitoTextoOk: {
    color: '#15803d',
    fontWeight: '500',
  },
  requisitoTextoPendiente: {
    color: '#6b7280',
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emailPillInfo: {
    flex: 1,
    marginRight: 8,
  },
  emailPillLabel: {
    fontSize: 11,
    color: '#1d4ed8',
  },
  emailPillValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  changeEmailBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  changeEmailText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpInput: {
    height: 58,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: COLORS.text,
    paddingHorizontal: 16,
  },
  otpHint: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonPressed: {
    backgroundColor: '#eff6ff',
  },
  secondaryButtonDisabled: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  secondaryButtonTextDisabled: {
    color: '#9ca3af',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default RegisterScreen;

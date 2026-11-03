import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { COLORS } from '../config';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validations = useMemo(() => {
    const trimmedEmail = email.trim();
    const emailValid = EMAIL_REGEX.test(trimmedEmail);
    const hasMinLength = password.length >= 6;
    const hasNumberOrUpper =
      /[0-9]/.test(password) || /[A-Z]/.test(password);
    const passwordsMatch =
      password.length > 0 && password === confirmPassword;

    let strengthScore = 0;
    if (hasMinLength) strengthScore += 1;
    if (password.length >= 8) strengthScore += 1;
    if (hasNumberOrUpper) strengthScore += 1;

    return {
      emailValid,
      hasMinLength,
      hasNumberOrUpper,
      passwordsMatch,
      strengthScore,
      canContinueStep1: emailValid && hasMinLength && passwordsMatch,
    };
  }, [email, password, confirmPassword]);

  const extractBackendError = (error, fallback) =>
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    fallback;

  const handleRequestOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!validations.emailValid) {
      setErrorMsg('Ingresá un correo electrónico válido.');
      return;
    }
    if (!validations.hasMinLength) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!validations.passwordsMatch) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/otp/solicitar', { email: email.trim() });
      setStep(2);
      setCooldown(60);
      setInfoMsg(`Enviamos un código a ${email.trim()}`);
    } catch (error) {
      setErrorMsg(
        extractBackendError(
          error,
          'No se pudo enviar el código de verificación.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setResending(true);
    try {
      await api.post('/api/auth/otp/reenviar', { email: email.trim() });
      setCooldown(60);
      setInfoMsg('Código reenviado a tu correo.');
    } catch (error) {
      setErrorMsg(
        extractBackendError(error, 'No se pudo reenviar el código.')
      );
    } finally {
      setResending(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!codigoOtp.trim() || codigoOtp.trim().length < 4) {
      setErrorMsg('Ingresá el código de verificación.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/otp/verificar', {
        email: email.trim(),
        codigo: codigoOtp.trim(),
      });

      await api.post('/api/auth/registro', {
        usernameOrEmail: email.trim(),
        password,
      });

      await login(email.trim(), password);
    } catch (error) {
      setErrorMsg(
        extractBackendError(
          error,
          'Código inválido o el correo ya está registrado.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCondition = (fulfilled, label) => (
    <View style={styles.conditionRow}>
      <View
        style={[
          styles.conditionDot,
          fulfilled ? styles.conditionDotSuccess : styles.conditionDotPending,
        ]}
      >
        <Text
          style={[
            styles.conditionDotIcon,
            fulfilled && styles.conditionDotIconSuccess,
          ]}
        >
          {fulfilled ? '✓' : ''}
        </Text>
      </View>
      <Text
        style={[
          styles.conditionText,
          fulfilled && styles.conditionTextSuccess,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Paso {step} de 2</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(step / 2) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.card}>
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {infoMsg ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{infoMsg}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                    email.length > 0 &&
                      validations.emailValid &&
                      styles.inputWrapperValid,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    placeholder="nombre@correo.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Text style={styles.toggleText}>
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Repetir contraseña</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'confirm' && styles.inputWrapperFocused,
                    confirmPassword.length > 0 &&
                      validations.passwordsMatch &&
                      styles.inputWrapperValid,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    placeholder="Repetí tu contraseña"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    value={confirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <Text style={styles.toggleText}>
                      {showConfirmPassword ? 'Ocultar' : 'Ver'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.conditionsCard}>
                {renderCondition(
                  validations.emailValid,
                  'Correo electrónico válido'
                )}
                {renderCondition(
                  validations.hasMinLength,
                  'Mínimo 6 caracteres'
                )}
                {renderCondition(
                  validations.hasNumberOrUpper,
                  'Incluye mayúscula o número (recomendado)'
                )}
                {renderCondition(
                  validations.passwordsMatch,
                  'Las contraseñas coinciden'
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!validations.canContinueStep1 || loading) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleRequestOtp}
                disabled={!validations.canContinueStep1 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continuar</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Código de verificación</Text>
                <TextInput
                  style={[
                    styles.otpInput,
                    focusedField === 'otp' && styles.inputWrapperFocused,
                  ]}
                  placeholder="000000"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={codigoOtp}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(val) => {
                    setCodigoOtp(val.replace(/[^0-9]/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (loading || codigoOtp.trim().length < 4) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleVerifyAndRegister}
                disabled={loading || codigoOtp.trim().length < 4}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Confirmar y crear cuenta
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resending || cooldown > 0}
                >
                  <Text
                    style={[
                      styles.secondaryLink,
                      cooldown > 0 && styles.linkMuted,
                    ]}
                  >
                    {resending
                      ? 'Reenviando...'
                      : cooldown > 0
                      ? `Reenviar en ${cooldown}s`
                      : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep(1);
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                >
                  <Text style={styles.mutedLink}>Cambiar correo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Ya tenés cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 22,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
  },
  inputWrapperValid: {
    borderColor: '#10b981',
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  actionBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  conditionsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  conditionDotPending: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  conditionDotSuccess: {
    backgroundColor: '#10b981',
  },
  conditionDotIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: 'transparent',
  },
  conditionDotIconSuccess: {
    color: '#ffffff',
  },
  conditionText: {
    fontSize: 12.5,
    color: '#64748b',
  },
  conditionTextSuccess: {
    color: '#047857',
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  secondaryLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  linkMuted: {
    color: '#94a3b8',
  },
  mutedLink: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../config';

export default function LoginScreen({ navigation }) {
  const {
    signIn,
    biometricAvailable,
    biometricEnabled,
    authenticateWithBiometrics,
  } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const canSubmit = usernameOrEmail.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!usernameOrEmail.trim() || !password) {
      setErrorMsg('Completá tu usuario/correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await signIn({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });
    } catch (error) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === 'string' ? error.response.data : null);
      setErrorMsg(backendMsg || 'Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMsg(null);
    setBiometricLoading(true);
    try {
      const success = await authenticateWithBiometrics();
      if (!success) {
        setErrorMsg('No se pudo verificar la identidad biométrica.');
      }
    } catch {
      setErrorMsg('Error al intentar autenticación biométrica.');
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>H</Text>
          </View>
          <Text style={styles.brandTitle}>Hallado</Text>
          <Text style={styles.brandSubtitle}>Iniciá sesión en tu cuenta</Text>
        </View>

        <View style={styles.card}>
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Usuario o correo</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'user' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.inputField}
                placeholder="nombre@correo.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={usernameOrEmail}
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
                onChangeText={(val) => {
                  setUsernameOrEmail(val);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
              {usernameOrEmail.length > 0 && (
                <TouchableOpacity
                  onPress={() => setUsernameOrEmail('')}
                  style={styles.actionBtn}
                >
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contraseña</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotLink}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.inputField}
                placeholder="Tu contraseña"
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

          <TouchableOpacity
            style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading || loading}
              activeOpacity={0.85}
            >
              {biometricLoading ? (
                <ActivityIndicator color="#047857" />
              ) : (
                <Text style={styles.biometricButtonText}>
                  Ingresar con biometría
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿No tenés cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
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
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  actionBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  biometricButton: {
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  biometricButtonText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
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

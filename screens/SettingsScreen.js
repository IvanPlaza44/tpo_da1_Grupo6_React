import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../config';

export const SettingsScreen = () => {
  const { biometricEnabled, toggleBiometric, user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkHardware = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsSupported(hasHardware && isEnrolled);
      } catch (error) {
        console.error('Error al verificar soporte biométrico:', error);
        setIsSupported(false);
      }
    };

    checkHardware();
  }, []);

  const handleToggleBiometric = async (nextValue) => {
    if (!isSupported && nextValue) {
      Alert.alert(
        'Biometría no disponible',
        'Tu dispositivo no cuenta con huella o reconocimiento facial configurado.'
      );
      return;
    }

    try {
      setUpdating(true);
      const success = await toggleBiometric(nextValue);
      if (success) {
        Alert.alert(
          nextValue ? 'Biometría activada' : 'Biometría desactivada',
          nextValue
            ? 'Ahora podrás desbloquear tu sesión usando tu huella o rostro.'
            : 'Se desactivó el desbloqueo biométrico.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración de biometría.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Seguridad de la Sesión</Text>

      <View style={styles.card}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Desbloqueo con Huella / Rostro</Text>
          <Text style={styles.description}>
            {isSupported
              ? 'Usá la biometría del dispositivo para recuperar tu sesión guardada en forma segura.'
              : 'No se detectó huella o rostro configurado en este dispositivo.'}
          </Text>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={handleToggleBiometric}
          disabled={updating}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={biometricEnabled ? COLORS.primary : '#f3f4f6'}
        />
      </View>

      {user?.email ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Cuenta vinculada:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  infoBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default SettingsScreen;

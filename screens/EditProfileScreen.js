import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import InsigniasUsuario from '../components/InsigniasUsuario';
import {
  calcularResumenReputacion,
  formatearAntiguedad,
  tieneInsigniaVecinoSolidario,
} from '../utils/insignias';

const BARRIOS_SUGERIDOS = [
  'Belgrano',
  'Palermo',
  'Caballito',
  'Recoleta',
  'Almagro',
  'Núñez',
];

export const EditProfileScreen = ({ onAbrirPerfil }) => {
  const { user, biometricEnabled, toggleBiometric, logout } = useAuth();
  const {
    profile,
    loadingProfile,
    refreshProfile,
    updateProfile,
    updateProfilePhoto,
  } = useProfile();

  const [nombre, setNombre] = useState('');
  const [barrio, setBarrio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoVisible, setTelefonoVisible] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [updatingBiometric, setUpdatingBiometric] = useState(false);

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setBarrio(profile.barrio || '');
      setTelefono(profile.telefono || '');
      setTelefonoVisible(Boolean(profile.telefonoVisible));
      setFotoPreview(profile.fotoPerfil || null);
    }
  }, [profile]);

  useEffect(() => {
    const checkHardware = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(hasHardware && isEnrolled);
      } catch {
        setIsBiometricSupported(false);
      }
    };

    checkHardware();
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    return (
      nombre.trim() !== (profile.nombre || '') ||
      barrio.trim() !== (profile.barrio || '') ||
      telefono.trim() !== (profile.telefono || '') ||
      Boolean(telefonoVisible) !== Boolean(profile.telefonoVisible)
    );
  }, [profile, nombre, barrio, telefono, telefonoVisible]);

  const profileCompletion = useMemo(() => {
    let completed = 0;
    const total = 4;
    if (nombre.trim().length > 0) completed += 1;
    if (barrio.trim().length > 0) completed += 1;
    if (telefono.trim().length > 0) completed += 1;
    if (fotoPreview) completed += 1;
    const percentage = Math.round((completed / total) * 100);
    return {
      completed,
      total,
      percentage,
      isComplete: completed === total,
    };
  }, [nombre, barrio, telefono, fotoPreview]);

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para seleccionar una foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedAsset = result.assets[0];
      setFotoPreview(selectedAsset.uri);

      setUploadingPhoto(true);
      const updated = await updateProfilePhoto(selectedAsset);
      if (updated?.fotoPerfil) {
        setFotoPreview(updated.fotoPerfil);
      }
      Alert.alert(
        'Foto actualizada',
        'Tu foto de perfil se actualizó correctamente.'
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudo subir la foto de perfil.';
      Alert.alert('Error al subir foto', msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        nombre: nombre.trim(),
        barrio: barrio.trim(),
        telefono: telefono.trim(),
        telefonoVisible,
      });
      Alert.alert(
        'Perfil actualizado',
        'Tus datos fueron guardados correctamente.'
      );
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        'No se pudieron guardar los cambios.';
      Alert.alert('Error al guardar', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBiometric = async (nextValue) => {
    if (!isBiometricSupported && nextValue) {
      Alert.alert(
        'Biometría no disponible',
        'Tu dispositivo no cuenta con huella o rostro configurado.'
      );
      return;
    }

    try {
      setUpdatingBiometric(true);
      const success = await toggleBiometric(nextValue);
      if (success) {
        Alert.alert(
          nextValue ? 'Biometría activada' : 'Biometría desactivada',
          nextValue
            ? 'Ahora podrás ingresar usando tu huella o rostro.'
            : 'Se desactivó el ingreso biométrico.'
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la biometría.');
    } finally {
      setUpdatingBiometric(false);
    }
  };

  if (loadingProfile && !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const reputacion = calcularResumenReputacion({
    valoracionesPositivas: profile?.valoracionesPositivas,
    valoracionesNegativas: profile?.valoracionesNegativas,
  });

  const esSolidario = tieneInsigniaVecinoSolidario(
    profile?.devolucionesConcretadas
  );
  const displayEmail = profile?.email || user?.email || '';
  const initialLetter = (nombre || displayEmail || 'U').charAt(0).toUpperCase();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarContainer}>
            {fotoPreview ? (
              <Image
                source={{ uri: fotoPreview }}
                style={[
                  styles.avatar,
                  esSolidario && styles.avatarSolidario,
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  esSolidario && styles.avatarSolidario,
                ]}
              >
                <Text style={styles.avatarInitial}>{initialLetter}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {nombre || 'Mi perfil'}
              </Text>
              {esSolidario ? (
                <View style={styles.solidarioTag}>
                  <Text style={styles.solidarioTagText}>Solidario</Text>
                </View>
              ) : null}
            </View>
            {displayEmail ? (
              <Text style={styles.emailText} numberOfLines={1}>
                {displayEmail}
              </Text>
            ) : null}
            <View style={styles.metaPillsRow}>
              {barrio.trim() ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{barrio.trim()}</Text>
                </View>
              ) : null}
              {profile?.fechaAlta ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {formatearAntiguedad(profile.fechaAlta)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.completionWrap}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>
              {profileCompletion.isComplete
                ? 'Perfil completo'
                : 'Completitud del perfil'}
            </Text>
            <Text
              style={[
                styles.completionValue,
                profileCompletion.isComplete && styles.completionValueDone,
              ]}
            >
              {profileCompletion.percentage}%
            </Text>
          </View>
          <View style={styles.completionTrack}>
            <View
              style={[
                styles.completionFill,
                { width: `${profileCompletion.percentage}%` },
                profileCompletion.isComplete && styles.completionFillDone,
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={handlePickImage}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.changePhotoText}>
            {uploadingPhoto ? 'Subiendo foto...' : 'Cambiar foto de perfil'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          {hasUnsavedChanges ? (
            <View style={styles.unsavedBadge}>
              <Text style={styles.unsavedBadgeText}>Sin guardar</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nombre visible</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'nombre' && styles.inputFocused,
            ]}
          >
            <TextInput
              style={styles.inputField}
              placeholder="Tu nombre y apellido"
              placeholderTextColor="#9ca3af"
              value={nombre}
              onFocus={() => setFocusedField('nombre')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setNombre}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {nombre.length > 0 && focusedField === 'nombre' ? (
              <TouchableOpacity
                onPress={() => setNombre('')}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Barrio</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'barrio' && styles.inputFocused,
            ]}
          >
            <TextInput
              style={styles.inputField}
              placeholder="Ej: Belgrano, Caballito, Palermo"
              placeholderTextColor="#9ca3af"
              value={barrio}
              onFocus={() => setFocusedField('barrio')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setBarrio}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {barrio.length > 0 && focusedField === 'barrio' ? (
              <TouchableOpacity
                onPress={() => setBarrio('')}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {BARRIOS_SUGERIDOS.map((sugerido) => {
              const selected =
                barrio.trim().toLowerCase() === sugerido.toLowerCase();
              return (
                <TouchableOpacity
                  key={sugerido}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setBarrio(sugerido)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {sugerido}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Teléfono de contacto</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedField === 'telefono' && styles.inputFocused,
            ]}
          >
            <TextInput
              style={styles.inputField}
              placeholder="Ej: +54 9 11 1234-5678"
              placeholderTextColor="#9ca3af"
              value={telefono}
              onFocus={() => setFocusedField('telefono')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {telefono.length > 0 && focusedField === 'telefono' ? (
              <TouchableOpacity
                onPress={() => setTelefono('')}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacidad y seguridad</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>
              Mostrar teléfono en reclamos aceptados
            </Text>
            <Text style={styles.toggleDescription}>
              {telefonoVisible
                ? 'Visible para la otra parte al aceptar un reclamo.'
                : 'Oculto. Solo te contactarás dentro de la app.'}
            </Text>
          </View>
          <Switch
            value={telefonoVisible}
            onValueChange={setTelefonoVisible}
            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
            thumbColor={telefonoVisible ? COLORS.primary : '#f8fafc'}
          />
        </View>

        <View style={styles.rowDivider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>Ingreso con biometría</Text>
            <Text style={styles.toggleDescription}>
              {isBiometricSupported
                ? 'Habilitá el acceso rápido con huella o rostro.'
                : 'No disponible en este dispositivo.'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            disabled={updatingBiometric}
            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
            thumbColor={biometricEnabled ? COLORS.primary : '#f8fafc'}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (saving || uploadingPhoto) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || uploadingPhoto}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {hasUnsavedChanges ? 'Guardar cambios' : 'Actualizar perfil'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.reputationHeader}>
          <Text style={styles.sectionTitle}>Reputación</Text>
          <Text style={styles.reputationBadge}>{reputacion.etiqueta}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricNumber}>
              {profile?.devolucionesConcretadas ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Devoluciones</Text>
          </View>

          <View style={[styles.metricBox, styles.metricBoxPositive]}>
            <Text style={[styles.metricNumber, styles.positiveText]}>
              +{reputacion.positivas}
            </Text>
            <Text style={styles.metricLabel}>Positivas</Text>
          </View>

          <View style={[styles.metricBox, styles.metricBoxNegative]}>
            <Text style={[styles.metricNumber, styles.negativeText]}>
              -{reputacion.negativas}
            </Text>
            <Text style={styles.metricLabel}>Negativas</Text>
          </View>
        </View>

        {reputacion.total > 0 ? (
          <View style={styles.ratioSection}>
            <View style={styles.ratioHeader}>
              <Text style={styles.ratioLabel}>Balance positivo</Text>
              <Text style={styles.ratioValue}>
                {reputacion.porcentajePositivas}%
              </Text>
            </View>
            <View style={styles.ratioTrack}>
              <View
                style={[
                  styles.ratioFill,
                  { width: `${reputacion.porcentajePositivas}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.rowDivider} />

        <InsigniasUsuario
          devolucionesConcretadas={profile?.devolucionesConcretadas}
          insignias={profile?.insignias}
          mostrarProgreso
        />

        {profile?.id && onAbrirPerfil ? (
          <TouchableOpacity
            style={styles.publicProfileBtn}
            onPress={() => onAbrirPerfil(profile.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.publicProfileBtnText}>
              Ver mi perfil público
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity onPress={refreshProfile} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Sincronizar con el servidor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          style={styles.logoutBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 32,
    backgroundColor: '#f8fafc',
    gap: 14,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  avatarSolidario: {
    borderColor: '#f59e0b',
  },
  avatarPlaceholder: {
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  solidarioTag: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  solidarioTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  emailText: {
    fontSize: 13,
    color: '#475569',
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  completionWrap: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  completionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  completionValueDone: {
    color: '#059669',
  },
  completionTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  completionFillDone: {
    backgroundColor: '#10b981',
  },
  changePhotoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  unsavedBadge: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unsavedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
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
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#ffffff',
  },
  inputField: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  clearBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chipsRow: {
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reputationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reputationBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricBoxPositive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  metricBoxNegative: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  positiveText: {
    color: '#16a34a',
  },
  negativeText: {
    color: COLORS.danger,
  },
  ratioSection: {
    gap: 6,
    marginTop: 2,
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  ratioValue: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
  ratioTrack: {
    height: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratioFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  publicProfileBtn: {
    marginTop: 4,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  publicProfileBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  footerActions: {
    gap: 10,
    marginTop: 4,
  },
  refreshBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  refreshText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default EditProfileScreen;

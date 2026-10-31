import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config';
import { useProfile } from '../hooks/useProfile';
import InsigniasUsuario from '../components/InsigniasUsuario';
import { calcularResumenReputacion, formatearAntiguedad } from '../utils/insignias';

export const EditProfileScreen = ({ onAbrirPerfil }) => {
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
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setBarrio(profile.barrio || '');
      setTelefono(profile.telefono || '');
      setTelefonoVisible(Boolean(profile.telefonoVisible));
      setFotoPreview(profile.fotoPerfil || null);
    }
  }, [profile]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      Alert.alert('Foto actualizada', 'Tu foto de perfil se actualizó correctamente.');
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
        nombre,
        barrio,
        telefono,
        telefonoVisible,
      });
      Alert.alert('Perfil actualizado', 'Tus datos personales y de privacidad fueron guardados.');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.avatarSection}>
        {fotoPreview ? (
          <Image source={{ uri: fotoPreview }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {(nombre || profile?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Pressable
          style={styles.changePhotoBtn}
          onPress={handlePickImage}
          disabled={uploadingPhoto}
        >
          <Text style={styles.changePhotoText}>
            {uploadingPhoto ? 'Subiendo foto...' : 'Cambiar foto de perfil'}
          </Text>
        </Pressable>

        {profile?.fechaAlta ? (
          <Text style={styles.antiguedadText}>
            {formatearAntiguedad(profile.fechaAlta)}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nombre visible</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Nicolás Sack"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Barrio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Belgrano, Caballito, Palermo..."
          value={barrio}
          onChangeText={setBarrio}
        />

        <Text style={styles.label}>Teléfono de contacto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: +54 9 11 1234-5678"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.privacyCard}>
        <View style={styles.privacyTextWrap}>
          <Text style={styles.privacyTitle}>Mostrar teléfono al aceptar un reclamo</Text>
          <Text style={styles.privacyDescription}>
            {telefonoVisible
              ? 'Tu teléfono será visible para la otra parte cuando se acepte un reclamo.'
              : 'Modo privado: no se compartirá tu teléfono y te comunicarás solo por la app.'}
          </Text>
        </View>
        <Switch
          value={telefonoVisible}
          onValueChange={setTelefonoVisible}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={telefonoVisible ? COLORS.primary : '#f3f4f6'}
        />
      </View>

      <View style={styles.buttonWrap}>
        <Button
          title={saving ? 'Guardando...' : 'Guardar cambios'}
          onPress={handleSave}
          disabled={saving || uploadingPhoto}
        />
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Mi Reputación e Insignias</Text>
        <Text style={styles.statsLine}>
          Devoluciones concretadas:{' '}
          <Text style={styles.statsBold}>{profile?.devolucionesConcretadas ?? 0}</Text>
        </Text>
        <Text style={styles.statsLine}>
          Valoraciones:{' '}
          <Text style={styles.positiveText}>👍 {reputacion.positivas}</Text> ·{' '}
          <Text style={styles.negativeText}>👎 {reputacion.negativas}</Text> (
          {reputacion.etiqueta})
        </Text>

        <View style={styles.badgesDivider} />

        <InsigniasUsuario
          devolucionesConcretadas={profile?.devolucionesConcretadas}
          insignias={profile?.insignias}
          mostrarProgreso
        />

        {profile?.id && onAbrirPerfil ? (
          <Pressable
            style={styles.publicProfileBtn}
            onPress={() => onAbrirPerfil(profile.id)}
          >
            <Text style={styles.publicProfileBtnText}>
              Ver cómo ven los demás mi Perfil Público ›
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={refreshProfile} style={styles.refreshBtn}>
        <Text style={styles.refreshText}>Actualizar datos del servidor</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
    gap: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  changePhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  antiguedadText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  section: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 6,
  },
  input: {
    height: 46,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
  },
  privacyTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  },
  buttonWrap: {
    marginTop: 4,
  },
  statsCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    gap: 6,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statsLine: {
    fontSize: 14,
    color: COLORS.text,
  },
  statsBold: {
    fontWeight: 'bold',
  },
  positiveText: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  negativeText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  badgesDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  publicProfileBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  publicProfileBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  refreshBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  refreshText: {
    color: COLORS.muted,
    fontSize: 12,
  },
});

export default EditProfileScreen;

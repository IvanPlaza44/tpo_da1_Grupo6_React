import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../config';
import { obtenerPerfilPublico } from '../services/usuarios';
import InsigniasUsuario from '../components/InsigniasUsuario';
import ListaAgradecimientos from '../components/ListaAgradecimientos';
import {
  calcularResumenReputacion,
  formatearAntiguedad,
} from '../utils/insignias';

// Pantalla de Perfil Público (GET /api/usuarios/{id}).
// Reglas de negocio estrictas:
// - Muestra reputación (valoraciones positivas/negativas), insignias y antigüedad en la plataforma.
// - NO muestra nunca el teléfono ni el historial de publicaciones.
export const PublicProfileScreen = ({ route, usuarioId: propUsuarioId, onVolver }) => {
  const targetUserId = propUsuarioId ?? route?.params?.usuarioId;
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarPerfil = useCallback(async () => {
    if (!targetUserId) {
      setError('No se especificó el usuario a consultar.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await obtenerPerfilPublico(targetUserId);
      setPerfil(data);
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        'No se pudo cargar el perfil público del usuario.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !perfil) {
    return (
      <View style={styles.center}>
        {onVolver ? (
          <Pressable onPress={onVolver} style={styles.backBtnTop}>
            <Text style={styles.backText}>‹ Volver</Text>
          </Pressable>
        ) : null}
        <Text style={styles.errorText}>{error || 'Usuario no encontrado'}</Text>
        <Pressable onPress={cargarPerfil} style={styles.retryBtn}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const reputacion = calcularResumenReputacion({
    valoracionesPositivas: perfil.valoracionesPositivas,
    valoracionesNegativas: perfil.valoracionesNegativas,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {onVolver ? (
        <Pressable onPress={onVolver} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </Pressable>
      ) : null}

      <View style={styles.headerCard}>
        {perfil.fotoPerfil ? (
          <Image source={{ uri: perfil.fotoPerfil }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {(perfil.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.name}>{perfil.nombre || `Usuario #${perfil.id}`}</Text>

        {perfil.barrio ? (
          <Text style={styles.neighborhood}>📍 {perfil.barrio}</Text>
        ) : null}

        <Text style={styles.antiguedad}>
          🗓️ {formatearAntiguedad(perfil.fechaAlta)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reputación en la Comunidad</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricNumber}>
              {perfil.devolucionesConcretadas ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Devoluciones concretadas</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={[styles.metricNumber, styles.positiveText]}>
              👍 {reputacion.positivas}
            </Text>
            <Text style={styles.metricLabel}>Positivas</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={[styles.metricNumber, styles.negativeText]}>
              👎 {reputacion.negativas}
            </Text>
            <Text style={styles.metricLabel}>Negativas</Text>
          </View>
        </View>

        <Text style={styles.reputationSummary}>{reputacion.etiqueta}</Text>
      </View>

      <View style={styles.card}>
        <InsigniasUsuario
          devolucionesConcretadas={perfil.devolucionesConcretadas}
          insignias={perfil.insignias}
        />
      </View>

      <View style={styles.card}>
        <ListaAgradecimientos usuarioId={perfil.id} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backBtnTop: {
    marginBottom: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  neighborhood: {
    fontSize: 14,
    color: COLORS.text,
  },
  antiguedad: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  positiveText: {
    color: '#16a34a',
  },
  negativeText: {
    color: COLORS.danger,
  },
  reputationSummary: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PublicProfileScreen;

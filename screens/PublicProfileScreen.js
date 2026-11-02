import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
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
  tieneInsigniaVecinoSolidario,
} from '../utils/insignias';

export const PublicProfileScreen = ({
  route,
  usuarioId: propUsuarioId,
  onVolver,
}) => {
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
        'No se pudo cargar el perfil público.';
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
          <TouchableOpacity onPress={onVolver} style={styles.backBtnTop}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.errorText}>
          {error || 'Usuario no encontrado'}
        </Text>
        <TouchableOpacity onPress={cargarPerfil} style={styles.retryBtn}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const reputacion = calcularResumenReputacion({
    valoracionesPositivas: perfil.valoracionesPositivas,
    valoracionesNegativas: perfil.valoracionesNegativas,
  });

  const esSolidario = tieneInsigniaVecinoSolidario(
    perfil.devolucionesConcretadas
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        {onVolver ? (
          <TouchableOpacity onPress={onVolver} style={styles.backBtn}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <Text style={styles.topBarLabel}>Perfil público</Text>
      </View>

      <View style={styles.headerCard}>
        {perfil.fotoPerfil ? (
          <Image
            source={{ uri: perfil.fotoPerfil }}
            style={[styles.avatar, esSolidario && styles.avatarSolidario]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              esSolidario && styles.avatarSolidario,
            ]}
          >
            <Text style={styles.avatarInitial}>
              {(perfil.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.name}>
          {perfil.nombre || `Usuario #${perfil.id}`}
        </Text>

        {esSolidario ? (
          <View style={styles.solidarioBanner}>
            <Text style={styles.solidarioBannerText}>Vecino solidario</Text>
          </View>
        ) : null}

        <View style={styles.metaPillsRow}>
          {perfil.barrio ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{perfil.barrio}</Text>
            </View>
          ) : null}
          {perfil.fechaAlta ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {formatearAntiguedad(perfil.fechaAlta)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.reputationHeader}>
          <Text style={styles.sectionTitle}>Reputación</Text>
          <Text style={styles.reputationBadge}>{reputacion.etiqueta}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricNumber}>
              {perfil.devolucionesConcretadas ?? 0}
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
    padding: 18,
    paddingBottom: 32,
    gap: 14,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtnTop: {
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  headerCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 2,
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
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  solidarioBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  solidarioBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metaPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  reputationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
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
    justifyContent: 'space-between',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
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
    textAlign: 'center',
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
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PublicProfileScreen;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config';
import {
  INSIGNIA_VECINO_SOLIDARIO,
  META_DEVOLUCIONES_SOLIDARIO,
  obtenerInsigniasUsuario,
  tieneInsigniaVecinoSolidario,
} from '../utils/insignias';

export default function InsigniasUsuario({
  devolucionesConcretadas = 0,
  insignias = [],
  mostrarProgreso = false,
}) {
  const listaInsignias = obtenerInsigniasUsuario({
    devolucionesConcretadas,
    insignias,
  });
  const esVecinoSolidario = tieneInsigniaVecinoSolidario(devolucionesConcretadas);
  const actual = Math.min(
    Number(devolucionesConcretadas) || 0,
    META_DEVOLUCIONES_SOLIDARIO
  );
  const porcentaje = Math.min(
    100,
    Math.round((actual / META_DEVOLUCIONES_SOLIDARIO) * 100)
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Insignias</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{listaInsignias.length}</Text>
        </View>
      </View>

      {listaInsignias.length === 0 ? (
        <Text style={styles.emptyText}>Sin insignias desbloqueadas aún.</Text>
      ) : (
        <View style={styles.badgesWrap}>
          {listaInsignias.map((nombreInsignia) => {
            const destacada =
              nombreInsignia.toLowerCase() ===
              INSIGNIA_VECINO_SOLIDARIO.toLowerCase();

            return (
              <View
                key={nombreInsignia}
                style={[styles.badge, destacada && styles.badgeSolidario]}
              >
                <View
                  style={[
                    styles.badgeDot,
                    destacada && styles.badgeDotSolidario,
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.badgeTitle,
                      destacada && styles.badgeTitleSolidario,
                    ]}
                  >
                    {nombreInsignia}
                  </Text>
                  {destacada && (
                    <Text style={styles.badgeSubtitle}>
                      5+ devoluciones concretadas
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {mostrarProgreso && !esVecinoSolidario && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Próxima insignia: {INSIGNIA_VECINO_SOLIDARIO}
            </Text>
            <Text style={styles.progressCounter}>
              {actual}/{META_DEVOLUCIONES_SOLIDARIO}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${porcentaje}%` }]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  badgeSolidario: {
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  badgeDotSolidario: {
    backgroundColor: '#d97706',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeTitleSolidario: {
    color: '#92400e',
  },
  badgeSubtitle: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  progressSection: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressCounter: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});

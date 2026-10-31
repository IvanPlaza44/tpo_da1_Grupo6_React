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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insignias</Text>

      {listaInsignias.length === 0 ? (
        <Text style={styles.emptyText}>
          Todavía no tiene insignias desbloqueadas.
        </Text>
      ) : (
        <View style={styles.badgesWrap}>
          {listaInsignias.map((nombreInsignia) => {
            const destacada =
              nombreInsignia.toLowerCase() === INSIGNIA_VECINO_SOLIDARIO.toLowerCase();

            return (
              <View
                key={nombreInsignia}
                style={[styles.badge, destacada && styles.badgeSolidario]}
              >
                <Text style={styles.badgeIcon}>{destacada ? '🏅' : '⭐'}</Text>
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
                      5 o más devoluciones concretadas
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {mostrarProgreso && !esVecinoSolidario && (
        <Text style={styles.progressText}>
          Devoluciones concretadas: {Number(devolucionesConcretadas) || 0} /{' '}
          {META_DEVOLUCIONES_SOLIDARIO} para desbloquear "{INSIGNIA_VECINO_SOLIDARIO}"
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
  },
  badgeSolidario: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badgeTitleSolidario: {
    color: '#b45309',
  },
  badgeSubtitle: {
    fontSize: 11,
    color: '#92400e',
  },
  progressText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
});

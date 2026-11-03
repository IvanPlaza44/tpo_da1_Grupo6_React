import { StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS } from '../../config';

const TONOS = {
  aviso: { fondo: COLORS.warningSoft, color: COLORS.warning },
  error: { fondo: COLORS.dangerSoft, color: COLORS.danger },
  ok: { fondo: COLORS.successSoft, color: COLORS.success },
  info: { fondo: COLORS.primarySoft, color: COLORS.primaryDark },
};

export default function Aviso({ children, tono = 'aviso' }) {
  const paleta = TONOS[tono] || TONOS.aviso;
  return <Text style={[styles.aviso, { backgroundColor: paleta.fondo, color: paleta.color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  aviso: {
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

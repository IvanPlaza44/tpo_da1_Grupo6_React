import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../config';

const TIPOS = {
  PERDIDO: { texto: 'Perdido', color: COLORS.perdido, fondo: COLORS.perdidoSoft },
  ENCONTRADO: { texto: 'Encontrado', color: COLORS.encontrado, fondo: COLORS.encontradoSoft },
};

const ESTADOS = {
  ABIERTA: { texto: 'Abierta', color: COLORS.encontrado, fondo: COLORS.encontradoSoft },
  EN_RECLAMO: { texto: 'En reclamo', color: COLORS.warning, fondo: COLORS.warningSoft },
  RESUELTA: { texto: 'Resuelta', color: COLORS.success, fondo: COLORS.successSoft },
  VENCIDA: { texto: 'Vencida', color: COLORS.muted, fondo: '#E7E5E4' },
  BORRADOR: { texto: 'Borrador', color: COLORS.warning, fondo: COLORS.warningSoft },
  PENDIENTE: { texto: 'Pendiente de envío', color: COLORS.warning, fondo: COLORS.warningSoft },
  ACEPTADO: { texto: 'Aceptado', color: COLORS.success, fondo: COLORS.successSoft },
  RECHAZADO: { texto: 'Rechazado', color: COLORS.danger, fondo: COLORS.dangerSoft },
  VENCIDO: { texto: 'Vencido', color: COLORS.muted, fondo: '#E7E5E4' },
};

// Distintivo corto para tipo (perdido/encontrado) o estado de una publicación o reclamo.
export default function StatusBadge({ tipo, estado, texto }) {
  const preset = (tipo && TIPOS[tipo]) || (estado && ESTADOS[estado]) || null;
  const label = texto || preset?.texto;
  if (!label) return null;

  return (
    <View style={[styles.badge, { backgroundColor: preset?.fondo || COLORS.primarySoft }]}>
      <Text style={[styles.texto, { color: preset?.color || COLORS.primary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  texto: { fontSize: 11, fontWeight: '700' },
});

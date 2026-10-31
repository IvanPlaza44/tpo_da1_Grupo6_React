import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { COLORS } from '../config';
import { aFechaIso, desdeFechaIso, formatearFecha } from '../utils/fechas';

const TIPOS = [
  { valor: null, texto: 'Todos' },
  { valor: 'PERDIDO', texto: 'Perdidos' },
  { valor: 'ENCONTRADO', texto: 'Encontrados' },
];

export const FILTROS_VACIOS = { desde: null, hasta: null, tipo: null };

export const hayFiltros = ({ desde, hasta, tipo }) => Boolean(desde || hasta || tipo);

// filtros: { desde: 'YYYY-MM-DD' | null, hasta: 'YYYY-MM-DD' | null, tipo: 'PERDIDO' | 'ENCONTRADO' | null }
export default function FiltrosHistorial({ filtros, onCambiar }) {
  const cambiar = (cambios) => onCambiar({ ...filtros, ...cambios });

  // "Desde" no puede quedar después de "hasta", y ninguna fecha puede ser futura.
  const elegirFecha = (campo) => {
    const hoy = new Date();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: filtros[campo] ? desdeFechaIso(filtros[campo]) : hoy,
      minimumDate: campo === 'hasta' && filtros.desde ? desdeFechaIso(filtros.desde) : undefined,
      maximumDate: campo === 'desde' && filtros.hasta ? desdeFechaIso(filtros.hasta) : hoy,
      onChange: (evento, fecha) => {
        if (evento.type === 'set' && fecha) cambiar({ [campo]: aFechaIso(fecha) });
      },
    });
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        {TIPOS.map((t) => (
          <Pressable
            key={t.texto}
            style={[styles.chip, filtros.tipo === t.valor && styles.chipActivo]}
            onPress={() => cambiar({ tipo: t.valor })}
          >
            <Text style={[styles.chipTexto, filtros.tipo === t.valor && styles.chipTextoActivo]}>{t.texto}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.fila}>
        {[
          ['desde', 'Desde'],
          ['hasta', 'Hasta'],
        ].map(([campo, etiqueta]) => (
          <View key={campo} style={styles.fecha}>
            <Pressable style={styles.fechaBoton} onPress={() => elegirFecha(campo)}>
              <Text style={filtros[campo] ? styles.fechaTexto : styles.fechaPlaceholder}>
                {etiqueta}: {filtros[campo] ? formatearFecha(filtros[campo]) : 'cualquiera'}
              </Text>
            </Pressable>
            {filtros[campo] ? (
              <Pressable hitSlop={8} onPress={() => cambiar({ [campo]: null })}>
                <Text style={styles.quitar}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
      {hayFiltros(filtros) ? (
        <Pressable onPress={() => onCambiar(FILTROS_VACIOS)}>
          <Text style={styles.limpiar}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  fila: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActivo: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  chipTexto: { color: COLORS.muted },
  chipTextoActivo: { color: COLORS.primary, fontWeight: 'bold' },
  fecha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  fechaBoton: { flex: 1, paddingVertical: 8 },
  fechaTexto: { color: COLORS.text },
  fechaPlaceholder: { color: COLORS.muted },
  quitar: { color: COLORS.muted, fontSize: 16, paddingLeft: 6 },
  limpiar: { color: COLORS.primary, alignSelf: 'flex-end' },
});

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';

function Valoracion({ caso, onValorar }) {
  const { miValoracion, yaValore, puedeValorar, fechaLimiteValoracion } = caso;

  if (yaValore && miValoracion) {
    return (
      <View style={styles.valoracion}>
        <Text style={styles.valoracionTexto}>
          Valoraste:{' '}
          <Text style={miValoracion.positiva ? styles.positiva : styles.negativa}>
            {miValoracion.positiva ? 'Positiva' : 'Negativa'}
          </Text>
        </Text>
        {miValoracion.comentario ? <Text style={styles.comentario}>"{miValoracion.comentario}"</Text> : null}
      </View>
    );
  }
  if (yaValore) {
    return <Text style={[styles.valoracion, styles.valoracionTexto]}>Ya valoraste esta devolución</Text>;
  }
  if (puedeValorar) {
    return (
      <View style={[styles.valoracion, styles.valoracionFila]}>
        <Text style={styles.plazo}>Podés valorar hasta el {formatearFecha(fechaLimiteValoracion)}</Text>
        {onValorar ? (
          <Pressable style={styles.botonValorar} onPress={() => onValorar(caso)}>
            <Text style={styles.botonValorarTexto}>Valorar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    <Text style={[styles.valoracion, styles.plazo]}>
      El plazo para valorar venció el {formatearFecha(fechaLimiteValoracion)}
    </Text>
  );
}

// Solo quien recuperó su objeto puede agradecer públicamente a quien se lo devolvió.
function Agradecimiento({ caso, onAgradecer }) {
  const { rol, miAgradecimiento, yaAgradeci, puedeAgradecer } = caso;
  if (rol !== 'RECUPERE') return null;

  if (yaAgradeci) {
    return (
      <View style={styles.seccion}>
        <Text style={styles.valoracionTexto}>Agradecimiento público:</Text>
        {miAgradecimiento?.mensaje ? <Text style={styles.comentario}>"{miAgradecimiento.mensaje}"</Text> : null}
      </View>
    );
  }
  if (!puedeAgradecer || !onAgradecer) return null;
  return (
    <View style={[styles.seccion, styles.valoracionFila]}>
      <Text style={styles.plazo}>Podés dejarle un agradecimiento visible en su perfil</Text>
      <Pressable style={styles.botonSecundario} onPress={() => onAgradecer(caso)}>
        <Text style={styles.botonSecundarioTexto}>Agradecer</Text>
      </Pressable>
    </View>
  );
}

// Un caso resuelto del historial (devolví o recuperé).
export default function TarjetaCaso({ caso, onAbrirPerfil, onValorar, onAgradecer }) {
  const { rol, titulo, tipo, categoria, fechaDevolucion, fotoPrincipal, contraparte } = caso;

  return (
    <View style={styles.tarjeta}>
      <View style={styles.cuerpo}>
        {fotoPrincipal ? (
          <Image source={{ uri: fotoPrincipal }} style={styles.foto} />
        ) : (
          <View style={[styles.foto, styles.sinFoto]}>
            <Text style={styles.sinFotoTexto}>Sin foto</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
          <Text style={styles.detalle}>
            {tipo === 'PERDIDO' ? 'Perdido' : 'Encontrado'} · {CATEGORIAS[categoria]} · {formatearFecha(fechaDevolucion)}
          </Text>
          <Text style={styles.contraparte}>
            {rol === 'DEVOLVI' ? 'Se lo devolviste a ' : 'Te lo devolvió '}
            <Text
              style={onAbrirPerfil && styles.enlace}
              onPress={onAbrirPerfil ? () => onAbrirPerfil(contraparte.id) : undefined}
            >
              {contraparte.nombre}
            </Text>
          </Text>
        </View>
      </View>
      <Valoracion caso={caso} onValorar={onValorar} />
      <Agradecimiento caso={caso} onAgradecer={onAgradecer} />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12 },
  cuerpo: { flexDirection: 'row', gap: 12 },
  valoracion: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: COLORS.border },
  valoracionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  valoracionTexto: { color: COLORS.text },
  positiva: { color: '#16a34a', fontWeight: 'bold' },
  negativa: { color: COLORS.danger, fontWeight: 'bold' },
  comentario: { color: COLORS.muted, fontStyle: 'italic', marginTop: 2 },
  plazo: { flex: 1, color: COLORS.muted },
  botonValorar: { backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  botonValorarTexto: { color: '#fff', fontWeight: 'bold' },
  seccion: { marginTop: 8 },
  botonSecundario: { borderWidth: 1, borderColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  botonSecundarioTexto: { color: COLORS.primary, fontWeight: 'bold' },
  foto: { width: 64, height: 64, borderRadius: 4 },
  sinFoto: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 12 },
  info: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  detalle: { color: COLORS.muted },
  contraparte: { marginTop: 4, color: COLORS.text },
  enlace: { color: COLORS.primary, fontWeight: 'bold' },
});

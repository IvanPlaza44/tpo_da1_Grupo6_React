import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import BotonSeguir from '../components/BotonSeguir';
import { EstadoCargando } from '../components/EstadoPantalla';
import { COLORS } from '../config';
import { useConexion } from '../hooks/useConexion';
import { getErrorMessage } from '../services/api';
import { obtenerPublicacion } from '../services/publicaciones';
import { obtenerPerfilPublico } from '../services/usuarios';
import { CATEGORIAS, ESTADOS_PUBLICACION, TIPOS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';
import { calcularResumenReputacion } from '../utils/insignias';

const FRANJAS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche', NO_RECUERDO: 'No recuerdo' };
const RECLAMOS = { PENDIENTE: 'Pendiente', ACEPTADO: 'Aceptado', RECHAZADO: 'Rechazado', VENCIDO: 'Vencido' };

const dos = (numero) => String(numero).padStart(2, '0');

// La hora puede llegar como "14:30:00", como [14, 30] o como { hour, minute }.
const formatearHora = (hora) => {
  if (!hora) return '';
  if (typeof hora === 'string') return hora.slice(0, 5);
  if (Array.isArray(hora)) return `${dos(hora[0] ?? 0)}:${dos(hora[1] ?? 0)}`;
  return `${dos(hora.hour ?? 0)}:${dos(hora.minute ?? 0)}`;
};

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

// Detalle de una publicación (punto 4).
// - publicacionId: la publicación a mostrar.
// - onVolver: vuelve a la pantalla anterior.
// - onAbrirPerfil(id): abre el perfil público del publicador.
// - onIrA(clave): cambia de pestaña del menú (la gestión de la publicación propia).
// - onReclamar(publicacion): abre el reclamo (punto 7). Si todavía no existe, se avisa.
export default function DetalleScreen({ publicacionId, onVolver, onAbrirPerfil, onIrA, onReclamar }) {
  const { conectado } = useConexion();
  const { width } = useWindowDimensions();
  const [pub, setPub] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [fotoActual, setFotoActual] = useState(0);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      setPub(await obtenerPublicacion(publicacionId));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
    }
  }, [publicacionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!pub?.publicadorId || pub.esPropia) return undefined;
        let activo = true;
    obtenerPerfilPublico(pub.publicadorId)
      .then((datos) => {
        if (activo) setPerfil(datos);
      })
      .catch(() => {}); 
    return () => {
      activo = false;
    };
  }, [pub?.publicadorId, pub?.esPropia]);

  const botonVolver = (
    <Pressable onPress={onVolver} style={styles.volver}>
      <Text style={styles.volverTexto}>‹ Volver</Text>
    </Pressable>
  );

  if (cargando) return <EstadoCargando />;

  if (error || !pub) {
    return (
      <View style={styles.centro}>
        {botonVolver}
        <Text style={styles.error}>{error || 'No se encontró la publicación.'}</Text>
        <Pressable style={styles.boton} onPress={cargar}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const fotos = pub.fotos || [];
  const hora = formatearHora(pub.horaSuceso);
  const reputacion = perfil
    ? calcularResumenReputacion({
        valoracionesPositivas: perfil.valoracionesPositivas,
        valoracionesNegativas: perfil.valoracionesNegativas,
      })
    : null;

  // Solo se puede reclamar una publicación ajena que siga activa y sin un reclamo en curso.
  const puedeReclamar =
    !pub.esPropia &&
    ['ABIERTA', 'EN_RECLAMO'].includes(pub.estado) &&
    !['PENDIENTE', 'ACEPTADO'].includes(pub.miReclamoEstado);
  const textoReclamo = pub.tipo === 'ENCONTRADO' ? 'Es mío' : 'Lo encontré';

  const reclamar = () => {
    if (onReclamar) onReclamar(pub);
    else Alert.alert('Próximamente', 'Esta función todavía no está disponible.');
  };

  return (
    <ScrollView>
      {botonVolver}

      {fotos.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(evento) =>
              setFotoActual(Math.round(evento.nativeEvent.contentOffset.x / width))
            }
          >
            {fotos.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width, height: 260 }} resizeMode="cover" />
            ))}
          </ScrollView>
          {fotos.length > 1 && (
            <Text style={styles.contadorFotos}>
              {fotoActual + 1} / {fotos.length}
            </Text>
          )}
        </View>
      ) : (
        <View style={[styles.sinFotos, { width }]}>
          <Text style={styles.sinFotosTexto}>Esta publicación no tiene fotos</Text>
        </View>
      )}

      <View style={styles.contenido}>
        <View style={styles.fila}>
          <Text style={styles.etiquetaTipo}>{TIPOS[pub.tipo] || pub.tipo}</Text>
          <Text style={styles.estado}>{ESTADOS_PUBLICACION[pub.estado] || pub.estado}</Text>
        </View>

        <Text style={styles.titulo}>{pub.titulo || 'Sin título'}</Text>
        {pub.descripcion ? <Text style={styles.descripcion}>{pub.descripcion}</Text> : null}

        <Dato etiqueta="Categoría" valor={CATEGORIAS[pub.categoria] || pub.categoria} />
        <Dato etiqueta="Fecha del suceso" valor={formatearFecha(pub.fechaSuceso)} />
        <Dato
          etiqueta="Franja horaria"
          valor={[FRANJAS[pub.franjaHoraria] || pub.franjaHoraria, hora].filter(Boolean).join(' · ')}
        />
        <Dato etiqueta="Barrio" valor={pub.barrio} />
        {pub.direccionExacta ? (
          <Dato etiqueta="Dirección exacta" valor={pub.direccionExacta} />
        ) : !pub.esPropia ? (
          <Text style={styles.nota}>La dirección exacta se muestra cuando se acepta un reclamo.</Text>
        ) : null}

                {!pub.esPropia ? (
          <View style={styles.tarjeta}>
            <Text style={styles.seccion}>Publicado por</Text>
            <Text style={styles.nombre}>{pub.publicadorNombre || `Usuario #${pub.publicadorId}`}</Text>
            {reputacion ? (
              <Text style={styles.datoValor}>
                👍 {reputacion.positivas} · 👎 {reputacion.negativas} — {reputacion.etiqueta}
              </Text>
            ) : null}
            <Pressable
              style={[styles.boton, styles.botonSecundario]}
              onPress={() => onAbrirPerfil?.(pub.publicadorId)}
            >
              <Text style={styles.botonSecundarioTexto}>Ver perfil público</Text>
            </Pressable>
          </View>
        ) : null}

        {pub.esPropia ? (
          <Pressable style={styles.boton} onPress={() => onIrA?.('mis-publicaciones')}>
            <Text style={styles.botonTexto}>Gestionar mi publicación</Text>
          </Pressable>
        ) : (
          <View style={styles.acciones}>
            {pub.miReclamoEstado ? (
              <Text style={styles.estadoReclamo}>
                Tu reclamo: {RECLAMOS[pub.miReclamoEstado] || pub.miReclamoEstado}
              </Text>
            ) : null}
            {puedeReclamar ? (
              <Pressable
                style={[styles.boton, !conectado && styles.botonInactivo]}
                disabled={!conectado}
                onPress={reclamar}
              >
                <Text style={styles.botonTexto}>{textoReclamo}</Text>
              </Pressable>
            ) : null}
            {conectado ? (
              <BotonSeguir publicacionId={pub.id} siguiendo={pub.siguiendo} />
            ) : (
              <Pressable style={[styles.boton, styles.botonInactivo]} disabled>
                <Text style={styles.botonTexto}>Seguir publicación</Text>
              </Pressable>
            )}
            {!conectado ? (
              <Text style={styles.avisoSinConexion}>
                Necesitás conexión para reclamar o seguir esta publicación.
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
  volver: { paddingHorizontal: 16, paddingVertical: 10 },
  volverTexto: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  error: { color: COLORS.danger, textAlign: 'center' },
  sinFotos: { height: 160, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  sinFotosTexto: { color: COLORS.muted },
  contadorFotos: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  contenido: { padding: 16, gap: 10, paddingBottom: 40 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiquetaTipo: { color: COLORS.primary, fontWeight: '700' },
  estado: {
    backgroundColor: '#dbeafe',
    color: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  descripcion: { fontSize: 15, color: COLORS.text },
  dato: { flexDirection: 'row', gap: 8 },
  datoEtiqueta: { color: COLORS.muted, width: 130 },
  datoValor: { color: COLORS.text, flexShrink: 1 },
  nota: { color: COLORS.muted, fontSize: 13, fontStyle: 'italic' },
  tarjeta: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    gap: 6,
    marginTop: 6,
  },
  seccion: { color: COLORS.muted, fontSize: 13 },
  nombre: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  acciones: { gap: 10, marginTop: 6 },
  estadoReclamo: { color: COLORS.text, fontWeight: '600' },
  boton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  botonInactivo: { opacity: 0.5 },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  botonSecundarioTexto: { color: COLORS.text },
  avisoSinConexion: {
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
  },
});
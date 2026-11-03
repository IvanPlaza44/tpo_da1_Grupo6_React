import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../config';
import { EstadoCargando } from '../components/EstadoPantalla';
import PublicationCard from '../components/ui/PublicationCard';
import { useProfile } from '../hooks/useProfile';
import { obtenerMisPublicaciones } from '../services/publicaciones';
import { CATEGORIAS } from '../utils/etiquetas';
import { calcularResumenReputacion, formatearAntiguedad } from '../utils/insignias';

export default function PerfilHome({ onIrA, onAbrirPublicacion }) {
  const { profile, loadingProfile } = useProfile();
  const [publicaciones, setPublicaciones] = useState([]);

  useEffect(() => {
    let activo = true;
    obtenerMisPublicaciones()
      .then((lista) => {
        if (activo) setPublicaciones((Array.isArray(lista) ? lista : []).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  if (loadingProfile && !profile) return <EstadoCargando mensaje="Cargando tu perfil…" />;

  const nombre = profile?.nombre || 'Tu perfil';
  const reputacion = calcularResumenReputacion({
    valoracionesPositivas: profile?.valoracionesPositivas,
    valoracionesNegativas: profile?.valoracionesNegativas,
  });

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={styles.identidad}>
        {profile?.fotoPerfil ? (
          <Image source={{ uri: profile.fotoPerfil }} style={styles.foto} />
        ) : (
          <View style={styles.foto}>
            <Text style={styles.inicial}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.meta}>{profile?.barrio || 'Sin barrio'}</Text>
        <Text style={styles.meta}>{formatearAntiguedad(profile?.fechaAlta)}</Text>
        <Text style={styles.reputacion}>{reputacion.etiqueta}</Text>
      </View>

      {publicaciones.length > 0 ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Tus publicaciones</Text>
          {publicaciones.map((item) => (
            <PublicationCard
              key={item.id}
              foto={item.fotoPrincipal}
              titulo={item.titulo}
              tipo={item.tipo}
              estado={item.estado}
              linea={[CATEGORIAS[item.categoria], item.barrio].filter(Boolean).join(' · ')}
              onPress={onAbrirPublicacion ? () => onAbrirPublicacion(item.id) : undefined}
            />
          ))}
        </View>
      ) : null}

      <Pressable style={styles.fila} onPress={() => onIrA?.('perfil-editar')}>
        <View style={styles.textos}>
          <Text style={styles.filaTitulo}>Editar perfil</Text>
          <Text style={styles.filaDetalle}>Datos, reputación, biometría y sesión.</Text>
        </View>
        <Text style={styles.flecha}>›</Text>
      </Pressable>
      <Pressable style={styles.fila} onPress={() => onIrA?.('mis-publicaciones')}>
        <View style={styles.textos}>
          <Text style={styles.filaTitulo}>Ver todas mis publicaciones</Text>
          <Text style={styles.filaDetalle}>Publicadas, borradores y pendientes de envío.</Text>
        </View>
        <Text style={styles.flecha}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACE.lg, paddingBottom: 40, gap: SPACE.md },
  identidad: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACE.xl,
    alignItems: 'center',
    gap: 4,
  },
  foto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  inicial: { color: COLORS.primary, fontSize: 32, fontWeight: '800' },
  nombre: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  meta: { color: COLORS.muted, fontSize: 13 },
  reputacion: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '700', marginTop: 6 },
  bloque: { gap: SPACE.sm },
  bloqueTitulo: { fontSize: 13, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.4 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
  },
  textos: { flex: 1, gap: 4 },
  filaTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  filaDetalle: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  flecha: { color: COLORS.muted, fontSize: 22 },
});

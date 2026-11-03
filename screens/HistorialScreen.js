import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SPACE } from '../config';
import { listarHistorial } from '../services/historial';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaCaso from '../components/TarjetaCaso';
import FiltrosHistorial, { FILTROS_VACIOS, hayFiltros } from '../components/FiltrosHistorial';
import ModalValoracion from '../components/ModalValoracion';
import ModalAgradecimiento from '../components/ModalAgradecimiento';
import Segmented from '../components/ui/Segmented';

const PESTANIAS = [
  {
    rol: 'DEVOLVI',
    titulo: 'Devolví',
    vacio: 'Todavía no devolviste nada',
    vacioMensaje: 'Cuando le devuelvas algo a su dueño, aparece acá.',
  },
  {
    rol: 'RECUPERE',
    titulo: 'Recuperé',
    vacio: 'Todavía no recuperaste nada',
    vacioMensaje: 'Cuando alguien te devuelva algo tuyo, aparece acá.',
  },
];

// onAbrirPerfil(usuarioId): lo conecta la navegación para ir al perfil público de la contraparte.
export default function HistorialScreen({ onAbrirPerfil, onIrA }) {
  const [rol, setRol] = useState(PESTANIAS[0].rol);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const pestania = PESTANIAS.find((p) => p.rol === rol);

  return (
    <View style={styles.container}>
      <View style={styles.selector}>
        <Segmented
          opciones={PESTANIAS.map((p) => ({ value: p.rol, label: p.titulo }))}
          valor={rol}
          onChange={setRol}
        />
      </View>
      <FiltrosHistorial filtros={filtros} onCambiar={setFiltros} />
      <ListaCasos key={rol} pestania={pestania} filtros={filtros} onAbrirPerfil={onAbrirPerfil} onIrA={onIrA} />
    </View>
  );
}

function ListaCasos({ pestania, filtros, onAbrirPerfil, onIrA }) {
  const { desde, hasta, tipo } = filtros;
  const cargar = useCallback(
    () => listarHistorial({ rol: pestania.rol, desde, hasta, tipo }),
    [pestania.rol, desde, hasta, tipo]
  );
  const { datos, setDatos, cargando, refrescando, error, recargar, refrescar } = useListado(cargar);
  const [aValorar, setAValorar] = useState(null);
  const [aAgradecer, setAAgradecer] = useState(null);
  const filtrado = hayFiltros(filtros);

  const actualizarCaso = (id, cambios) =>
    setDatos((prev) => prev.map((c) => (c.publicacionId === id ? { ...c, ...cambios } : c)));

  const marcarValorado = (valoracion) => {
    actualizarCaso(aValorar.publicacionId, { miValoracion: valoracion, yaValore: true, puedeValorar: false });
    setAValorar(null);
  };

  const marcarAgradecido = (agradecimiento) => {
    actualizarCaso(aAgradecer.publicacionId, {
      miAgradecimiento: agradecimiento,
      yaAgradeci: true,
      puedeAgradecer: false,
    });
    setAAgradecer(null);
  };

  if (cargando) return <EstadoCargando mensaje="Cargando historial…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  return (
    <>
      <FlatList
        data={datos}
        keyExtractor={(item) => String(item.publicacionId)}
        refreshing={refrescando}
        onRefresh={refrescar}
        contentContainerStyle={datos.length === 0 ? styles.vacio : styles.lista}
        ListEmptyComponent={
          filtrado ? (
            <EstadoVacio titulo="No hay casos con estos filtros" mensaje="Probá con otro rango de fechas o tipo." />
          ) : (
            <EstadoVacio
              titulo={pestania.vacio}
              mensaje={pestania.vacioMensaje}
              accionTexto="Buscar"
              onAccion={() => onIrA?.('buscar')}
            />
          )
        }
        renderItem={({ item }) => (
          <TarjetaCaso
            caso={item}
            onAbrirPerfil={onAbrirPerfil}
            onValorar={setAValorar}
            onAgradecer={setAAgradecer}
          />
        )}
      />
      <ModalValoracion caso={aValorar} onCerrar={() => setAValorar(null)} onValorado={marcarValorado} />
      <ModalAgradecimiento caso={aAgradecer} onCerrar={() => setAAgradecer(null)} onAgradecido={marcarAgradecido} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selector: { marginHorizontal: SPACE.lg, marginTop: SPACE.md },
  lista: { padding: SPACE.lg, gap: 8 },
  vacio: { flexGrow: 1 },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import BotonGuardarAlerta from '../components/BotonGuardarAlerta';
import Chips from '../components/Chips';
import ResultadoCard from '../components/ResultadoCard';
import { COLORS } from '../config';
import { CATEGORIAS, ORDENES, RANGOS } from '../config/filtros';
import { getErrorMessage } from '../services/api';
import { buscarPublicaciones } from '../services/busqueda';
import { ordenarPorCercania } from '../utils/distancia';
import { resumenFiltros, sinVacios } from '../utils/filtros';
import { irA } from '../utils/navegacion';

const TAMANIO = 10; // resultados que se muestran por tanda
const TAMANIO_LOTE = 50; // al ordenar por cercanía se baja todo en lotes de 50
const MAX_PAGINAS = 20; // tope de seguridad para no pedir de más
const RANGOS_RAPIDOS = RANGOS.filter((r) => r.value !== 'RANGO');

// Pide permiso y devuelve { latitude, longitude }, o null si no se pudo.
const obtenerUbicacion = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Para ordenar por cercanía necesitamos tu ubicación.');
      return null;
    }
    const { coords } = await Location.getCurrentPositionAsync({});
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch (error) {
    Alert.alert('Error', 'No pudimos obtener tu ubicación. Revisá que el GPS esté activado.');
    return null;
  }
};

export default function ResultadosScreen({ navigation, route, onAbrirPublicacion, onIrA }) {
  const [filtros, setFiltros] = useState(route.params.filtros);
  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);

  const [orden, setOrden] = useState('RECIENTES');
  const [ubicacion, setUbicacion] = useState(null);
  const [limiteLocal, setLimiteLocal] = useState(TAMANIO); // cuántos se muestran en "más cercanos"
  const esCercanos = orden === 'CERCANOS' && ubicacion !== null;

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [borrador, setBorrador] = useState(filtros);

  const cargar = useCallback(async (numeroPagina, filtrosActuales) => {
    try {
      if (numeroPagina === 0) setCargando(true);
      else setCargandoMas(true);
      setError(null);
      const respuesta = await buscarPublicaciones({
        ...filtrosActuales,
        orden: 'RECIENTES', // lo de "más cercanos" lo ordena la app (el backend no recibe la ubicación)
        pagina: numeroPagina,
        tamanio: TAMANIO,
      });
      setItems((previos) =>
        numeroPagina === 0 ? respuesta.contenido : [...previos, ...respuesta.contenido]
      );
      setPagina(respuesta.pagina);
      setTotalPaginas(respuesta.totalPaginas);
      setTotal(respuesta.totalElementos);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, []);

  // "Más cercanos": para ordenar bien hay que tener TODOS los resultados, no solo la primera página.
  // Se piden todas las páginas (en lotes de 50) y después se muestran de a 10.
  const cargarTodo = useCallback(async (filtrosActuales) => {
    try {
      setCargando(true);
      setError(null);
      let todos = [];
      let numeroPagina = 0;
      let paginasTotales = 1;
      let elementosTotales = 0;
      while (numeroPagina < paginasTotales && numeroPagina < MAX_PAGINAS) {
        const respuesta = await buscarPublicaciones({
          ...filtrosActuales,
          orden: 'RECIENTES',
          pagina: numeroPagina,
          tamanio: TAMANIO_LOTE,
        });
        todos = todos.concat(respuesta.contenido);
        paginasTotales = respuesta.totalPaginas;
        elementosTotales = respuesta.totalElementos;
        numeroPagina += 1;
      }
      setItems(todos);
      setPagina(0);
      setTotalPaginas(1); // ya se bajó todo: no quedan páginas por pedir al servidor
      setTotal(elementosTotales);
      setLimiteLocal(TAMANIO);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
    }
  }, []);

  // Se ejecuta al entrar, al aplicar filtros nuevos y al cambiar el orden.
  useEffect(() => {
    if (esCercanos) cargarTodo(filtros);
    else cargar(0, filtros);
  }, [filtros, esCercanos, cargar, cargarTodo]);

  const ordenados = useMemo(
    () => (esCercanos ? ordenarPorCercania(items, ubicacion) : items),
    [items, esCercanos, ubicacion]
  );
  const visibles = esCercanos ? ordenados.slice(0, limiteLocal) : ordenados;

  const cargarMas = () => {
    if (cargando || cargandoMas || error) return;
    if (esCercanos) {
      // Ya está todo en el celular: solo se muestran 10 más.
      if (limiteLocal < ordenados.length) setLimiteLocal((limite) => limite + TAMANIO);
      return;
    }
    if (pagina + 1 >= totalPaginas) return;
    cargar(pagina + 1, filtros);
  };

  const cambiarOrden = async (nuevoOrden) => {
    if (nuevoOrden === 'CERCANOS' && !ubicacion) {
      const posicion = await obtenerUbicacion();
      if (!posicion) return;
      setUbicacion(posicion);
    }
    setOrden(nuevoOrden);
  };

  // ---- Refinar filtros sin volver al inicio ----
  const alternarPanel = () => {
    setBorrador(filtros);
    setPanelAbierto((abierto) => !abierto);
  };

  const cambiarBorrador = (campo, valor) =>
    setBorrador((actual) => ({ ...actual, [campo]: valor }));

  const aplicarFiltros = () => {
    const nuevos = {
      ...borrador,
      palabrasClave: (borrador.palabrasClave || '').trim(),
      barrio: (borrador.barrio || '').trim(),
    };
    if (nuevos.rango !== 'RANGO') {
      delete nuevos.fechaDesde;
      delete nuevos.fechaHasta;
    }
    setFiltros(sinVacios(nuevos));
    setPanelAbierto(false);
  };

  // ---- Navegación hacia otras partes de la app ----
  const abrirPublicacion = (id) =>
    onAbrirPublicacion ? onAbrirPublicacion(id) : irA(navigation, 'Detalle', { id });

  const irAPublicar = () => (onIrA ? onIrA('publicar') : irA(navigation, 'Publicar'));

  const encabezado = (
    <View style={styles.encabezado}>
      <Text style={styles.resumen}>{resumenFiltros(filtros)}</Text>
      {!cargando && !error && (
        <Text style={styles.contador}>
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </Text>
      )}

      <BotonGuardarAlerta criterios={filtros} />

      <Text style={styles.etiqueta}>Ordenar por</Text>
      <Chips opciones={ORDENES} valor={orden} onChange={cambiarOrden} />

      <TouchableOpacity style={styles.botonSecundario} onPress={alternarPanel}>
        <Text style={styles.botonSecundarioTexto}>
          {panelAbierto ? 'Cerrar filtros' : 'Refinar filtros'}
        </Text>
      </TouchableOpacity>

      {panelAbierto && (
        <View style={styles.panel}>
          <Text style={styles.etiqueta}>Categoría</Text>
          <Chips
            opciones={CATEGORIAS}
            valor={borrador.categoria}
            onChange={(valor) => cambiarBorrador('categoria', valor)}
            permitirVacio
          />
          <Text style={styles.etiqueta}>Cuándo</Text>
          <Chips
            opciones={RANGOS_RAPIDOS}
            valor={borrador.rango}
            onChange={(valor) => cambiarBorrador('rango', valor)}
            permitirVacio
          />
          <Text style={styles.etiqueta}>Barrio</Text>
          <TextInput
            style={styles.input}
            placeholder="Barrio o localidad"
            value={borrador.barrio || ''}
            onChangeText={(texto) => cambiarBorrador('barrio', texto)}
          />
          <Text style={styles.etiqueta}>Palabras clave</Text>
          <TextInput
            style={styles.input}
            placeholder="Palabras clave"
            value={borrador.palabrasClave || ''}
            onChangeText={(texto) => cambiarBorrador('palabrasClave', texto)}
          />
          <TouchableOpacity style={styles.botonPrincipal} onPress={aplicarFiltros}>
            <Text style={styles.botonPrincipalTexto}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const estadoVacio = () => {
    if (cargando) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.espacio} />;
    }
    if (error) {
      return (
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>No pudimos cargar los resultados</Text>
          <Text style={styles.vacioTexto}>{error}</Text>
          <TouchableOpacity style={styles.botonPrincipal} onPress={() => cargar(0, filtros)}>
            <Text style={styles.botonPrincipalTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioTitulo}>No encontramos resultados</Text>
        <Text style={styles.vacioTexto}>
          Probá con otros filtros, publicá lo tuyo o guardá esta búsqueda como alerta.
        </Text>
        <TouchableOpacity style={styles.botonPrincipal} onPress={irAPublicar}>
          <Text style={styles.botonPrincipalTexto}>
            {filtros.tipo === 'ENCONTRADO' ? 'Publicar mi hallazgo' : 'Publicar mi pérdida'}
          </Text>
        </TouchableOpacity>
        {/* El botón de alertas lo armó el compañero de "Mis alertas": recibe los criterios. */}
        <View style={styles.alerta}>
          <BotonGuardarAlerta criterios={filtros} />
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={visibles}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ResultadoCard item={item} onPress={() => abrirPublicacion(item.id)} />
      )}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={estadoVacio()}
      ListFooterComponent={
        cargandoMas ? <ActivityIndicator color={COLORS.primary} style={styles.espacio} /> : null
      }
      onEndReached={cargarMas}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.lista}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 40 },
  encabezado: { marginBottom: 12, gap: 8 },
  resumen: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  contador: { fontSize: 13, color: COLORS.muted },
  etiqueta: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginTop: 4 },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  botonPrincipal: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botonPrincipalTexto: { color: '#fff', fontWeight: '700' },
  botonSecundario: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  botonSecundarioTexto: { color: COLORS.primary, fontWeight: '600' },
  espacio: { marginVertical: 24 },
  vacio: { alignItems: 'stretch', paddingVertical: 24 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  alerta: { marginTop: 8 },
  vacioTexto: { color: COLORS.muted, textAlign: 'center', marginTop: 6, marginBottom: 8 },
});
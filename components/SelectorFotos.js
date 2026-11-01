import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config';

const MAX_FOTOS = 5;

// Muestra las fotos elegidas y deja agregar desde cámara o galería.
//   fotos: array de assets [{ uri, ... }]
//   onChange: se llama con el array nuevo
export default function SelectorFotos({ fotos, onChange }) {
  const lugar = MAX_FOTOS - fotos.length;

  const desdeCamara = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesitamos la cámara para sacar la foto');
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) onChange([...fotos, ...result.assets]);
  };

  const desdeGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: lugar,
      quality: 0.7, // comprime para subir menos datos
    });
    if (!result.canceled) onChange([...fotos, ...result.assets].slice(0, MAX_FOTOS));
  };

  const quitar = (uri) => onChange(fotos.filter((f) => f.uri !== uri));

  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        {fotos.map((foto) => (
          <View key={foto.uri}>
            <Image source={{ uri: foto.uri }} style={styles.miniatura} />
            <Pressable style={styles.quitar} onPress={() => quitar(foto.uri)}>
              <Text style={styles.quitarTexto}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {lugar > 0 && (
        <View style={styles.fila}>
          <Pressable style={styles.boton} onPress={desdeCamara}>
            <Text style={styles.botonTexto}>📷 Cámara</Text>
          </Pressable>
          <Pressable style={styles.boton} onPress={desdeGaleria}>
            <Text style={styles.botonTexto}>🖼️ Galería</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.ayuda}>{fotos.length} de {MAX_FOTOS} fotos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 10 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniatura: { width: 90, height: 90, borderRadius: 8 },
  quitar: { position: 'absolute', top: 2, right: 2, backgroundColor: '#000a', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  quitarTexto: { color: '#fff', fontSize: 12 },
  boton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  botonTexto: { color: COLORS.text },
  ayuda: { color: COLORS.muted },
});
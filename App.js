import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react'; //PARA PROBAR
import api from './services/api'; // PARA PROBAAAAR

export default function App() {
  useEffect(() => {
  api.get('/categorias')
    .then((r) => console.log('OK', r.data))
    .catch((e) => console.log('ERROR', e.message));
}, []);
  return (
    <View style={styles.container}>
      <Text>Hallado</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { StyleSheet, View } from 'react-native';

const GROSOR = 2;

function Marco({ children, size }) {
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

export function IconoBuscar({ color, size = 24 }) {
  const aro = Math.round(size * 0.56);
  return (
    <Marco size={size}>
      <View
        style={{
          width: aro,
          height: aro,
          borderRadius: aro / 2,
          borderWidth: GROSOR,
          borderColor: color,
          position: 'absolute',
          top: 2,
          left: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: Math.round(size * 0.32),
          height: GROSOR,
          backgroundColor: color,
          borderRadius: 1,
          bottom: 3,
          right: 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </Marco>
  );
}

export function IconoPublicar({ color, size = 24 }) {
  const largo = Math.round(size * 0.58);
  return (
    <Marco size={size}>
      <View style={[styles.trazo, { width: largo, height: GROSOR, backgroundColor: color }]} />
      <View style={[styles.trazo, { width: GROSOR, height: largo, backgroundColor: color }]} />
    </Marco>
  );
}

export function IconoActividad({ color, size = 24 }) {
  const ancho = Math.round(size * 0.46);
  const alto = Math.round(size * 0.4);
  return (
    <Marco size={size}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: ancho,
            height: alto,
            borderWidth: GROSOR,
            borderColor: color,
            borderTopLeftRadius: ancho,
            borderTopRightRadius: ancho,
            borderBottomLeftRadius: 3,
            borderBottomRightRadius: 3,
          }}
        />
        <View
          style={{
            width: Math.round(size * 0.62),
            height: GROSOR,
            backgroundColor: color,
            borderRadius: 1,
            marginTop: 2,
          }}
        />
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
            marginTop: 2,
          }}
        />
      </View>
    </Marco>
  );
}

export function IconoPerfil({ color, size = 24 }) {
  const cabeza = Math.round(size * 0.34);
  return (
    <Marco size={size}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: cabeza,
            height: cabeza,
            borderRadius: cabeza / 2,
            borderWidth: GROSOR,
            borderColor: color,
          }}
        />
        <View
          style={{
            width: Math.round(size * 0.68),
            height: Math.round(size * 0.28),
            borderTopLeftRadius: size,
            borderTopRightRadius: size,
            borderWidth: GROSOR,
            borderBottomWidth: 0,
            borderColor: color,
            marginTop: 2,
          }}
        />
      </View>
    </Marco>
  );
}

const styles = StyleSheet.create({
  trazo: { position: 'absolute', borderRadius: 1 },
});

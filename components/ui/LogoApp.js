import { Image } from 'react-native';

export default function LogoApp({ size = 32 }) {
  return (
    <Image
      source={require('../../assets/hallado-logo.png')}
      style={{ width: size, height: size }}
      accessibilityLabel="Hallado"
    />
  );
}

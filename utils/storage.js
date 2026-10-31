import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../config';

// El JWT va en SecureStore (encriptado), no en AsyncStorage.
export const saveToken = (token) => SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
export const getToken = () => SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
export const removeToken = () => SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
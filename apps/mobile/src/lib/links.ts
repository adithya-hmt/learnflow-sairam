import { Linking } from 'react-native';
import { safeExternalUrl } from './link-validation';

export const openExternalUrl = (value: string) => Linking.openURL(safeExternalUrl(value));

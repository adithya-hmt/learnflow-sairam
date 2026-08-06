import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { PhoneUsage } from './ExpoPhoneActivity.types';

declare class ExpoPhoneActivityModule extends NativeModule {
  hasUsageAccessAsync(): Promise<boolean>;
  openUsageAccessSettingsAsync(): Promise<void>;
  getUsageAsync(days: number): Promise<PhoneUsage>;
}

export default requireOptionalNativeModule<ExpoPhoneActivityModule>('ExpoPhoneActivity');

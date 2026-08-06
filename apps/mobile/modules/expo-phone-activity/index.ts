// Re-export the native module. On web, it will be resolved to ExpoPhoneActivityModule.web.ts
// and on native platforms to ExpoPhoneActivityModule.ts
export { default } from './src/ExpoPhoneActivityModule';
export * from './src/ExpoPhoneActivity.types';

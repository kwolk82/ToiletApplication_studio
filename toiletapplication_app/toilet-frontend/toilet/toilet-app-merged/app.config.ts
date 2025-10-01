// Dynamic Expo config (development-friendly)
import 'dotenv/config';
import type { ExpoConfig } from '@expo/config-types';

const NAME = 'My Toilet App';
const SLUG = 'my-toilet-app';

// Pick from env first (tunnel), fall back to a safe default
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://toilet-backend-starter.onrender.com';
const KAKAO_JAVASCRIPT_KEY = process.env.KAKAO_JAVASCRIPT_KEY ?? 'e305950d640265b7607964545cf2aa75';

const config: ExpoConfig = {
  name: NAME,
  slug: SLUG,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourteam.toilet',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: '주변 화장실을 안내하기 위해 위치 정보가 필요합니다.',
      // ⚠️ Always 권한을 실제로 쓰지 않는다면 아래 줄은 주석/삭제하세요.
      NSLocationAlwaysAndWhenInUseUsageDescription: '백그라운드에서도 위치 안내가 필요할 경우 사용됩니다.',
    },
  },
  android: {
    package: 'com.yourteam.toilet',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    usesCleartextTraffic: false,
  },
  plugins: [
    'expo-location',
    'expo-secure-store'
  ],
  extra: {
    API_BASE_URL,
    KAKAO_JAVASCRIPT_KEY,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    enabled: true,
  },
  entryPoint: './App.tsx',
};

export default config;

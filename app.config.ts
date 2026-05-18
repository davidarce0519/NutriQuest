import 'dotenv/config';

export default {
  expo: {
    name: 'NutriQuest',
    slug: 'nutriquest',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.nutriquest.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f172a',
      },
      package: 'com.nutriquest.app',
      edgeToEdgeEnabled: true,
      useNextNotificationsApi: true,
    },
    plugins: [
      'expo-secure-store',
      ['expo-notifications', {
        icon: './assets/icon.png',
        color: '#1a6b0a',
        sounds: [],
      }],
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
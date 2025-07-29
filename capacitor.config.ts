import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d84ff6ad361146e28beaead625f946d4',
  appName: 'circle-agent-growth',
  webDir: 'dist',
  server: {
    url: 'https://d84ff6ad-3611-46e2-8bea-ead625f946d4.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
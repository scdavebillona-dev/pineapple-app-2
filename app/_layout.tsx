import {
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { SplashScreen } from '@/components/splash-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as InferenceService from '@/services/ml-inference';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented by another lifecycle call.
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });
  const [modelsReady, setModelsReady] = useState(false);

  const appReady = !isLoading && fontsLoaded && modelsReady;

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {
      // Ignore hide errors during fast refresh.
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        console.log('🟢 [Root] Starting ONNX model preload...');
        await InferenceService.preloadModels();
        console.log('🟢 [Root] ONNX models loaded successfully');
        if (isMounted) {
          setModelsReady(true);
          if (timeoutHandle) clearTimeout(timeoutHandle);
        }
      } catch (error) {
        console.error('🔴 [Root] ONNX preload error:', error);
        if (isMounted) {
          console.warn('⚠️ [Root] Proceeding without ONNX models due to preload error');
          setModelsReady(true);
        }
      }
    })();

    // Fallback timeout: if models don't load in 15 seconds, proceed anyway
    timeoutHandle = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ [Root] ONNX preload timeout - proceeding with app');
        setModelsReady(true);
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, []);

  useEffect(() => {
    if (!appReady) return;
    if (segments[0] !== '(app)') {
      router.replace('/(app)/home');
    }
  }, [appReady, segments, router]);

  if (!appReady) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="(app)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

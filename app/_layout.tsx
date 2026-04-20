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
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { SplashScreen } from '@/components/splash-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as InferenceService from '@/services/ml-inference';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [modelsReady, setModelsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await InferenceService.preloadModels();
      } catch (error) {
        console.error('Failed to preload inference models:', error);
      } finally {
        if (isMounted) {
          setModelsReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [isLoading, fontsLoaded, segments, router]);

  if (isLoading || !fontsLoaded || !modelsReady) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
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

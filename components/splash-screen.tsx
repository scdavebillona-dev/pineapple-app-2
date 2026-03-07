/**
 * PineAI System - Branded Splash Screen
 * Displayed during app initialization
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial fade in and scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for loading indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Notify parent when ready (optional auto-finish)
    if (onFinish) {
      const timer = setTimeout(onFinish, 2000);
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, pulseAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="grass" size={56} color={Colors.primary} />
          </View>
        </View>

        {/* Brand Text */}
        <View style={styles.brandContainer}>
          <Animated.Text style={styles.brandName}>PineAI</Animated.Text>
          <Animated.Text style={styles.brandSubtitle}>SYSTEM</Animated.Text>
        </View>

        {/* Tagline */}
        <Animated.Text style={styles.tagline}>
          Intelligent Pineapple Classification
        </Animated.Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              styles.loadingDotMiddle,
              {
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Version */}
      <Animated.Text style={[styles.version, { opacity: fadeAnim }]}>
        Version 1.0.0
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandName: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.primary,
    letterSpacing: -1,
  },
  brandSubtitle: {
    ...Typography.h3,
    fontSize: 24,
    color: Colors.textSecondary,
    letterSpacing: 8,
    marginTop: -4,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxxxl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },
  loadingDotMiddle: {
    opacity: 0.7,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    ...Typography.caption,
    color: Colors.textMuted,
  },
});

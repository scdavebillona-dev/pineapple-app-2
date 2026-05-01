/**
 * PineAI System - Branded Splash Screen
 * Displayed during app initialization
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

    // Notify parent when ready (optional auto-finish)
    if (onFinish) {
      const timer = setTimeout(onFinish, 2000);
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, onFinish]);

  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.stagger(
        140,
        dotAnims.map((anim) =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
          ])
        )
      )
    );

    dotLoop.start();
    return () => dotLoop.stop();
  }, [dotAnims]);

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
        <View style={styles.brandContainer}>
          <Animated.Text style={styles.brandName}>PineAI</Animated.Text>
          <Animated.Text style={styles.brandSubtitle}>SYSTEM</Animated.Text>
        </View>

        <Animated.Text style={styles.tagline}>PineAI System</Animated.Text>

        <View style={styles.loadingRow}>
          {dotAnims.map((anim, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.loadingDot,
                {
                  opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
                  transform: [
                    {
                      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }),
                    },
                  ],
                },
              ]}
            >
              .
            </Animated.Text>
          ))}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.version, { opacity: fadeAnim }]}>Version 1.0.0</Animated.Text>
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
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    ...Typography.h3,
    color: Colors.primary,
    marginHorizontal: 4,
    lineHeight: 28,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    ...Typography.caption,
    color: '#000000',
  },
});

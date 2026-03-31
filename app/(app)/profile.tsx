import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ThemedView style={styles.container}>

      <ThemedView style={styles.logoWrap}>
        <ThemedView style={[styles.logoCircle, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
          <MaterialIcons name="grass" size={56} color={colors.primary} />
        </ThemedView>
        <ThemedText style={styles.subtitle}>PineAI System</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionMain}>
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.teamTitle]}>Developers</ThemedText>
        <ThemedView style={styles.developerRow}>
          <ThemedView style={styles.developerCol}>
            <ThemedView style={[styles.devCircle, { borderColor: colors.border }]}> 
              <Image source={require('@/assets/images/dave.jpg')} style={styles.devImage} resizeMode="cover" />
            </ThemedView>
            <ThemedText style={styles.devName}>Dave</ThemedText>
          </ThemedView>

          <ThemedView style={styles.developerCol}>
            <ThemedView style={[styles.devCircle, { borderColor: colors.border }]}> 
              <Image source={require('@/assets/images/john.png')} style={styles.devImage} resizeMode="cover" />
            </ThemedView>
            <ThemedText style={styles.devName}>John</ThemedText>
          </ThemedView>

          <ThemedView style={styles.developerCol}>
            <ThemedView style={[styles.devCircle, { borderColor: colors.border }]}> 
              <Image source={require('@/assets/images/sarah.jpg')} style={styles.devImage} resizeMode="cover" />
            </ThemedView>
            <ThemedText style={styles.devName}>Sarah</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.aboutBlock}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
        <ThemedText style={styles.bodyText}>
          PineAI is an AI-powered app that helps classify pineapples based on quality, maturity, and variety using image recognition for fast and accurate results.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.connectBlock}>
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.connectTitle]}>Connect Us</ThemedText>

        <ThemedView style={styles.connectRow}>
          <MaterialIcons name="email" size={18} color={colors.primary} />
          <ThemedText style={styles.connectText}>pineaisystem@gmail.com</ThemedText>
        </ThemedView>

        <ThemedView style={styles.connectRow}>
          <MaterialIcons name="phone" size={18} color={colors.primary} />
          <ThemedText style={styles.connectText}>+639083084629</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 22,
      paddingTop: Spacing.lg,
      paddingBottom: 28,
    },
    logoWrap: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
      marginBottom: Spacing.lg,
    },
    logoCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
    },
    subtitle: {
      marginTop: Spacing.md,
      color: colors.textSecondary,
      fontSize: 17,
      fontFamily: 'Montserrat_700Bold',
      fontWeight: '700',
    },
    sectionMain: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontSize: 17,
      color: colors.text,
      marginBottom: 12,
    },
    teamTitle: {
      marginBottom: 18,
    },
    developerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    developerCol: {
      flex: 1,
      alignItems: 'center',
    },
    devCircle: {
      width: 62,
      height: 62,
      borderRadius: 31,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginBottom: 8,
      overflow: 'hidden',
    },
    devImage: {
      width: '100%',
      height: '100%',
    },
    devInitials: {
      color: colors.text,
      fontFamily: 'Montserrat_600SemiBold',
      fontSize: 16,
    },
    devName: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 17,
    },
    aboutBlock: {
      marginTop: 0,
      marginBottom: Spacing.xl,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    connectBlock: {
      marginTop: 0,
    },
    connectTitle: {
      marginBottom: 6,
    },
    connectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 7,
    },
    connectText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

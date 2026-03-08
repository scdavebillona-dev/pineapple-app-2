/**
 * PineAI System - Professional Dashboard
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, EmptyState, ItemCard, StatCard } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { ScanResult, ScanStats } from '@/types';
import { calculateStats } from '@/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState<ScanStats>({
    total: 0,
    queen: 0,
    smoothCayenne: 0,
    avgConfidence: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const scanData = await AsyncStorage.getItem('scanHistory');
      if (scanData) {
        const rawScans = JSON.parse(scanData);
        const formattedScans: ScanResult[] = rawScans.map((s: any) => ({
          id: s.id || Math.random().toString(),
          label: (s.variety || s.label || 'Unknown') as any,
          confidence: s.confidence || 0,
          timestamp: s.timestamp || new Date().toISOString(),
          image: s.uri || s.image || '',
          quality: s.quality || '',
          qualityConfidence: s.metadata?.qualityConfidence,
          maturity: s.maturity || undefined,
          maturityConfidence: s.metadata?.maturityConfidence,
        }));
        const sortedScans = formattedScans.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setScans(sortedScans);
        setStats(calculateStats(sortedScans));
      } else {
        setScans([]);
        setStats({ total: 0, queen: 0, smoothCayenne: 0, avgConfidence: 0 });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const recentScans = scans.slice(0, 5);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Stats Grid - 3 cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/storage')}>
          <Text style={styles.seeAllLink}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Total Scans"
          value={stats.total}
          icon="assessment"
          style={styles.statCard}
        />
        <StatCard
          title="Queen"
          value={stats.queen}
          icon="crown" iconFamily="FontAwesome5"
          iconColor={colors.warning}
          style={styles.statCard}
        />
        <StatCard
          title="Smooth Cayenne"
          value={stats.smoothCayenne}
          icon="grass"
          iconColor={colors.secondary}
          style={styles.statCard}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>

      {recentScans.length > 0 ? (
        <Card padding="none" style={styles.recentList}>
          {recentScans.map((scan, index) => (
            <View key={index}>
              <ItemCard
                item={scan}
                onPress={() => router.push('/(app)/storage')}
                style={styles.recentItem}
              />
              {index < recentScans.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
      ) : (
        <Card variant="flat" padding="lg" style={styles.emptyCard}>
          <EmptyState
            icon="document-scanner"
            title="No scans yet"
            description="Your recent classifications will appear here."
            actionLabel="Start Scanning"
            onAction={() => router.push('/(app)/camera')}
          />
        </Card>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  seeAllLink: {
    ...Typography.bodySmallMedium,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
  },

  recentList: {
    marginBottom: Spacing.xl,
    backgroundColor: colors.surfaceElevated,
  },
  recentItem: {
    shadowColor: 'transparent',
    elevation: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  emptyCard: {
    marginTop: Spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  
  bottomSpace: {
    height: Spacing.xxxxl,
  },
});


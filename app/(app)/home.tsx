/**
 * PineAI System - Professional Dashboard
 */

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, EmptyState, ItemCard, StatCard } from '@/components/ui';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
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
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);

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

  const recentScans = scans.slice(0, 4);

  const openDetails = (scan: ScanResult) => {
    setSelectedScan(scan);
    setDetailsVisible(true);
  };

  const handleDelete = async (id: string, timestamp?: string) => {
    try {
      const existingScans = await AsyncStorage.getItem('scanHistory');
      if (!existingScans) return;

      const scansData = JSON.parse(existingScans).filter((scan: any) => {
        if (scan.id && scan.id === id) return false;
        if (!scan.id && timestamp && scan.timestamp === timestamp) return false;
        return true;
      });

      await AsyncStorage.setItem('scanHistory', JSON.stringify(scansData));
      setScans(prev => prev.filter(scan => scan.id !== id));
      setDetailsVisible(false);
      setSelectedScan(null);
      setShowDeletedModal(true);
      setTimeout(() => setShowDeletedModal(false), 1500);
    } catch (error) {
      console.error('Failed to delete scan:', error);
    }
  };

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
                onPress={() => openDetails(scan)}
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

      <Modal
        visible={detailsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailsVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Scan Details</Text>

            {selectedScan && (
              <>
                {selectedScan.image ? (
                  <Image source={{ uri: selectedScan.image }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={styles.noImageContainer}>
                    <MaterialIcons name="image-not-supported" size={36} color={colors.textMuted} />
                  </View>
                )}

                <View style={styles.resultRows}>
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Variety :</Text>
                    <Text style={styles.rowValue}>
                      {selectedScan.label === 'Smooth' ? 'Smooth Cayenne' : selectedScan.label}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Class :</Text>
                    <Text style={styles.rowValue}>{selectedScan.quality || 'Unknown'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Maturity :</Text>
                    <Text style={styles.rowValue}>{selectedScan.maturity || '—'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Confidence Level :</Text>
                    <TouchableOpacity
                      style={styles.viewConfidenceBtn}
                      onPress={() => selectedScan && setShowConfidenceModal(true)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="visibility" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Timestamp :</Text>
                    <Text style={[styles.rowValue, styles.timestampValue]}>
                      {new Date(selectedScan.timestamp).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setDetailsVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      if (!selectedScan) return;
                      Alert.alert(
                        'Confirm Deletion',
                        'Are you sure you want to delete, deleting can cause permanent delete',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => handleDelete(selectedScan.id, selectedScan.timestamp),
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#fff" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showConfidenceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfidenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultSheet}>
            <Text style={styles.resultTitle}>Model Confidence</Text>

            <View style={styles.resultRows}>
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Variety :</Text>
                <Text style={styles.rowValue}>
                  {selectedScan ? `${(selectedScan.confidence * 100).toFixed(2)}%` : '—'}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Maturity :</Text>
                <Text style={styles.rowValue}>
                  {selectedScan?.maturityConfidence !== undefined
                    ? `${(selectedScan.maturityConfidence * 100).toFixed(2)}%`
                    : '—'}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Quality :</Text>
                <Text style={styles.rowValue}>
                  {selectedScan?.qualityConfidence !== undefined
                    ? `${(selectedScan.qualityConfidence * 100).toFixed(2)}%`
                    : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => setShowConfidenceModal(false)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeletedModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deletedBox}>
            <MaterialIcons name="check-circle" size={56} color="#DC2626" />
            <Text style={styles.deletedText}>Deleted!</Text>
          </View>
        </View>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.lg,
  },
  modalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    backgroundColor: colors.surface,
  },
  noImageContainer: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  resultRows: {
    gap: 0,
    marginBottom: Spacing.xl,
  },
  resultSheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  rowLabel: {
    ...Typography.bodyMedium,
    color: colors.textMuted,
    marginRight: Spacing.xs,
  },
  rowValue: {
    ...Typography.bodySemiBold,
    color: colors.text,
    flex: 1,
  },
  viewConfidenceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  timestampValue: {
    fontSize: 13,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#DC2626',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  closeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#DC2626',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  deletedBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deletedText: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: '#DC2626',
  },
});


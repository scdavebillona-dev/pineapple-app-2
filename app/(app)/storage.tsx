import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ListRenderItem, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { EmptyState, FilterChips, ItemCard, SearchBar } from '@/components/ui';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { StorageService } from '@/lib/storage';

function formatDescriptiveDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type ScanItem = {
  id: string;
  name: string;
  confidence: number;
  uri: string;
  date: string;
  quality?: string;
  maturity?: string;
  metadata?: any;
};

// Mock categories for the filter
const FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'smooth', label: 'Smooth Cayenne' },
  { value: 'queen', label: 'Queen' },
  { value: 'extra', label: 'Extra Class' },
  { value: 'class-i', label: 'Class I' },
  { value: 'class-ii', label: 'Class II' },
];

export default function StorageScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState<ScanItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScanItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  // Reload whenever the tab gets focus
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const scans = await StorageService.getRecentScans(50);
      
      // Transform scans structure to match our list expectation if necessary
      // For demonstration, we assume they align with ScanItem.
      const formattedScans = scans.map((s: any) => ({
        id: s.id || Math.random().toString(),
        name: s.variety || s.label || 'Unknown',
        confidence: s.confidence || s.score || 0,
        uri: s.uri || s.imageUri || '',
        date: s.timestamp || new Date().toISOString(),
        quality: s.quality?.replace(/High Quality/i, 'Extra Class') || (s.confidence > 0.85 ? 'Extra Class' : 'Standard'),
        maturity: s.maturity || undefined,
          metadata: s.metadata,      }));

      setItems(formattedScans);      setFilteredItems(formattedScans);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter items when query or filter changes
  useEffect(() => {
    let result = [...items];

    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(lowerQuery) ||
          item.quality?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply category filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'smooth') {
        result = result.filter(item => item.name.toLowerCase().includes('smooth') || item.name.toLowerCase().includes('cayenne'));
      } else if (activeFilter === 'queen') {
        result = result.filter(item => item.name.toLowerCase().includes('queen'));
      } else if (activeFilter === 'extra') {
        result = result.filter(item => item.quality?.toLowerCase().includes('extra'));
      } else if (activeFilter === 'class-i') {
        result = result.filter(item => item.quality?.toLowerCase() === 'class i' || item.quality?.toLowerCase().includes('class i') && !item.quality?.toLowerCase().includes('ii'));
      } else if (activeFilter === 'class-ii') {
        result = result.filter(item => item.quality?.toLowerCase().includes('class ii') || item.quality?.toLowerCase().includes('class 2'));
      }
    }

    // Apply sort order
    result = result.sort((a, b) =>
      sortOrder === 'desc'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setFilteredItems(result);
  }, [searchQuery, activeFilter, items, sortOrder]);

  const handleDelete = (id: string, date?: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete, deleting can cause permanent delete",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await StorageService.deleteScan(id, date);
            const newItems = items.filter(item => item.id !== id);
            setItems(newItems);
            setModalVisible(false);
            setSelectedItem(null);
            
            // Show deleted confirmation
            setShowDeletedModal(true);
            setTimeout(() => {
              setShowDeletedModal(false);
            }, 1500);
          }
        }
      ]
    );
  };

  const openDetails = (item: ScanItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem: ListRenderItem<ScanItem> = ({ item }) => (
    <ItemCard
      item={{
        id: item.id,
        label: item.name as any,
        confidence: item.confidence,
        timestamp: item.date,
        image: item.uri,
        quality: item.quality as any,
        maturity: item.maturity,
        qualityConfidence: item.metadata?.qualityConfidence,
      }}
      onPress={() => openDetails(item)}
        onDelete={() => handleDelete(item.id, item.date)}
    />
  );

  const styles = useMemo(() => createStorageStyles(colors), [colors]);

  return (
    <ThemedView style={styles.container}>
      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search scans, materials, quality..."
          containerStyle={styles.searchBar}
        />
        
        <FilterChips
          chips={FILTER_OPTIONS}
          selectedValue={activeFilter}
          onSelect={setActiveFilter}
        />
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsSummary, { borderColor: colors.border }]}>
        <Text style={[styles.statsText, { color: colors.textMuted }]}>
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Text>
        <TouchableOpacity
          onPress={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
          style={styles.sortButton}
        >
          <MaterialIcons
            name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'}
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            filteredItems.length === 0 && styles.listEmpty,
            { paddingBottom: insets.bottom + Spacing.xxl }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-off"
              title={searchQuery ? 'No results found' : 'No scans yet'}
              description={
                searchQuery 
                  ? 'Try adjusting your search or filters to find what you are looking for.'
                  : 'Your scanned materials will appear here. Head over to the scanner to get started.'
              }
            />
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Tappable backdrop */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Scan Details</Text>

            {selectedItem && (
              <>
                {/* Image */}
                {selectedItem.uri ? (
                  <Image
                    source={{ uri: selectedItem.uri }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImageContainer}>
                    <MaterialIcons name="image-not-supported" size={36} color={colors.textMuted} />
                  </View>
                )}

                {/* Rows */}
                <View style={styles.resultRows}>
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Variety</Text>
                    <Text style={styles.rowValue}>{selectedItem.name?.replace('Smooth Cayenne', 'Smooth')}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Class</Text>
                    <Text style={styles.rowValue}>{selectedItem.quality || 'Unknown'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Maturity</Text>
                    <Text style={styles.rowValue}>{selectedItem.maturity || '—'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Confidence Level</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const varConf = (selectedItem.confidence * 100).toFixed(1) + '%';
                        const clsConf = selectedItem.metadata?.qualityConfidence
                          ? (selectedItem.metadata.qualityConfidence * 100).toFixed(1) + '%'
                          : 'N/A';
                        const matConf = selectedItem.metadata?.maturityConfidence
                          ? (selectedItem.metadata.maturityConfidence * 100).toFixed(1) + '%'
                          : 'N/A';
                        Alert.alert('Confidence Details', `Variety: ${varConf}\nClass: ${clsConf}\nMaturity: ${matConf}`);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="visibility" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Timestamp</Text>
                    <Text style={[styles.rowValue, styles.timestampValue]}>
                      {formatDescriptiveDate(selectedItem.date)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(selectedItem.id, selectedItem.date)}
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

      {/* Deleted Confirmation Modal */}
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

    </ThemedView>
  );
}

const createStorageStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statsText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    fontFamily: 'Montserrat_500Medium',
  },
  sortButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  cardItem: {
    marginBottom: 0,
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
  } as any,
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  resultRows: {
    gap: 0,
    marginBottom: Spacing.xl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  rowLabel: {
    ...Typography.bodyMedium,
    color: colors.textMuted,
    minWidth: 100,
  } as any,
  rowValue: {
    ...Typography.bodySemiBold,
    color: colors.text,
    flex: 1,
  } as any,
  timestampValue: {
    fontSize: 13,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
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
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  deletedBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deletedText: {
    ...Typography.h3,
    color: colors.text,
  } as any,
});


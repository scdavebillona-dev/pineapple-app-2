import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

export default function ModalScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity
          style={styles.closeIconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={22} color={colors.error} />
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Computer Vision Model</Text>

        <View style={styles.resultRows}>
          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Model :</Text>
            <Text style={styles.rowValue}>YOLO26</Text>
          </View>
          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Variety Model Accuracy :</Text>
            <Text style={styles.rowValue}>90%</Text>
          </View>
          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Maturity Smooth Accuracy :</Text>
            <Text style={styles.rowValue}>90%</Text>
          </View>
          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Maturity Queen Accuracy :</Text>
            <Text style={styles.rowValue}>90%</Text>
          </View>
          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Quality Smooth Accuracy :</Text>
            <Text style={styles.rowValue}>90%</Text>
          </View>
          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.rowLabel}>Quality Queen Accuracy :</Text>
            <Text style={styles.rowValue}>90%</Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
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
    closeIconBtn: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      zIndex: 2,
      padding: 4,
    },
    modalTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.lg,
      paddingRight: Spacing.xl,
    } as any,
    resultRows: {
      gap: 0,
      marginBottom: Spacing.xl,
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
      flex: 1,
    } as any,
    rowValue: {
      ...Typography.bodySemiBold,
      color: colors.text,
      minWidth: 52,
      textAlign: 'right',
    } as any,
  });

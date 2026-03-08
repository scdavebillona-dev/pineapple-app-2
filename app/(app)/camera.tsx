import { MaterialIcons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { StorageService } from '@/lib/storage';
import * as InferenceService from '@/services/ml-inference';

interface ScanResult {
  confidence: number;
  label: string;
  timestamp: string;
  image?: string;
  quality?: string;
  qualityConfidence?: number;
  maturity?: string;
  maturityConfidence?: number;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function CameraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const savedScale = useRef(new Animated.Value(0)).current;
  const savedOpacity = useRef(new Animated.Value(0)).current;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    (async () => {
      try {
        const apiStatus = await InferenceService.loadModel();
        setModel(apiStatus);
        setModelLoaded(true);
      } catch (error) {
        console.error('Failed to connect to Roboflow API:', error);
      }
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
    })();
  }, [cameraPermission, requestCameraPermission]);

  const handleCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 640, height: 640 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        setCapturedImage(manipResult.uri);
        setCurrentResult(null);
        analyzeImage(manipResult.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 640, height: 640 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        setCapturedImage(manipResult.uri);
        setCurrentResult(null);
        analyzeImage(manipResult.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async (imageUri?: string) => {
    const uri = imageUri ?? capturedImage;
    if (!uri) return;
    setIsProcessing(true);
    try {
      if (!modelLoaded || !model) {
        Alert.alert('API Not Ready', 'Waiting for Roboflow API connection.');
        return;
      }
      const inferenceResult = await InferenceService.performInference(uri, model);
      if (!inferenceResult.detection.hasPineapple) {
        Alert.alert('No Pineapple', 'No pineapple detected. Please try another image.');
        return;
      }
      const result: ScanResult = {
        confidence: inferenceResult.variety.confidence,
        label: inferenceResult.variety.label,
        timestamp: new Date().toISOString(),
        image: uri,
        quality: inferenceResult.quality.label?.replace(/High Quality/i, 'Extra Class') || 'Extra Class',
        qualityConfidence: inferenceResult.quality.confidence,
        maturity: inferenceResult.maturity.label !== 'Unknown' ? inferenceResult.maturity.label : undefined,
        maturityConfidence: inferenceResult.maturity.confidence,
      };
      setCurrentResult(result);
      setShowResultModal(true);
    } catch {
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveScan = async () => {
    if (!currentResult) return;
    setShowResultModal(false);
    try {
      await StorageService.saveScan({
        id: Math.random().toString(),
        variety: currentResult.label,
        confidence: currentResult.confidence,
        uri: currentResult.image,
        timestamp: currentResult.timestamp,
        quality: currentResult.quality?.replace(/High Quality/i, 'Extra Class') || 'Extra Class',
        maturity: currentResult.maturity,
        metadata: { qualityConfidence: currentResult.qualityConfidence, maturityConfidence: currentResult.maturityConfidence },
      });
      // Show animated saved modal
      savedScale.setValue(0);
      savedOpacity.setValue(0);
      setShowSavedModal(true);
      Animated.parallel([
        Animated.spring(savedScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(savedOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(savedOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setShowSavedModal(false);
            setCapturedImage(null);
            setCurrentResult(null);
          });
        }, 1500);
      });
    } catch {
      Alert.alert('Error', 'Failed to save scan');
    }
  };

  const handleRetake = () => {
    setShowResultModal(false);
    setCapturedImage(null);
    setCurrentResult(null);
  };

  const styles = useMemo(() => createCameraStyles(colors), [colors]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>

        {/* Main Scan Card */}
        <View style={styles.scanCard}>
          {/* Image Area */}
          <View style={styles.imageArea}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderIconWrap}>
                  <MaterialIcons name="photo-camera" size={40} color={colors.primary} />
                </View>
                <Text style={styles.placeholderTitle}>Capture or Upload</Text>
                <Text style={styles.placeholderSub}>Take a photo or pick from gallery</Text>
              </View>
            )}
          </View>

          {/* Card Actions - Bottom */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
              <Text style={styles.captureBtnText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} activeOpacity={0.8}>
              <MaterialIcons name="photo-library" size={20} color={colors.primary} />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Scanning Modal */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.scanningBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.scanningTitle}>Scanning...</Text>
            <Text style={styles.scanningSubtitle}>Analyzing your pineapple image</Text>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultSheet}>
            <Text style={styles.resultTitle}>Scan Result</Text>

            <View style={styles.resultRows}>
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Variety :</Text>
                <Text style={styles.rowValue}>
                  {currentResult?.label === 'Smooth' ? 'Smooth Cayenne' : (currentResult?.label ?? '—')}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Class :</Text>
                <Text style={styles.rowValue}>{currentResult?.quality ?? '—'}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Maturity :</Text>
                <Text style={styles.rowValue}>{currentResult?.maturity ?? '—'}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Confidence Level :</Text>
                <TouchableOpacity onPress={() => {
                  if (!currentResult) return;
                  const varConf = (currentResult.confidence * 100).toFixed(1) + '%';
                  const clsConf = currentResult.qualityConfidence
                    ? (currentResult.qualityConfidence * 100).toFixed(1) + '%'
                    : 'N/A';
                  const matConf = currentResult.maturityConfidence
                    ? (currentResult.maturityConfidence * 100).toFixed(1) + '%'
                    : 'N/A';
                  Alert.alert('Confidence Details', `Variety: ${varConf}\nClass: ${clsConf}\nMaturity: ${matConf}`);
                }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="visibility" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Timestamp :</Text>
                <Text style={[styles.rowValue, styles.timestampValue]}>
                  {currentResult ? formatTimestamp(currentResult.timestamp) : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                <MaterialIcons name="replay" size={18} color={colors.textSecondary} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveScan} activeOpacity={0.8}>
                <MaterialIcons name="save-alt" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Confirmation Modal */}
      <Modal visible={showSavedModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.savedBox, { opacity: savedOpacity, transform: [{ scale: savedScale }] }]}>
            <MaterialIcons name="check-circle" size={56} color={colors.success} />
            <Text style={styles.savedText}>Saved!</Text>
          </Animated.View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const createCameraStyles = (colors: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    justifyContent: 'flex-start',
    gap: Spacing.lg,
  },

  scanCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageArea: {
    aspectRatio: 1,
    width: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  placeholderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  placeholderTitle: {
    ...Typography.h4,
    color: colors.text,
    marginTop: Spacing.md,
  } as any,
  placeholderSub: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  } as any,
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  captureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  captureBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  uploadBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  scanningBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 220,
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanningTitle: {
    ...Typography.h3,
    color: colors.text,
  } as any,
  scanningSubtitle: {
    ...Typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  } as any,

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
  retakeBtn: {
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
  retakeBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
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

  savedBox: {
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
  savedText: {
    ...Typography.h3,
    color: colors.text,
  } as any,
});

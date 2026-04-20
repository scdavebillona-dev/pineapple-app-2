import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { StorageService } from '@/lib/storage';
import * as InferenceService from '@/services/ml-inference';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera as VisionCamera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';

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

async function resolveImageAspectRatio(
  uri: string,
  width?: number,
  height?: number
): Promise<number> {
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    return width / height;
  }

  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (w, h) => resolve(w > 0 && h > 0 ? w / h : 1),
      () => resolve(1)
    );
  });
}

function mapBoxToLetterbox(
  box: InferenceService.DetectionBox,
  aspectRatio: number
): { leftPct: number; topPct: number; widthPct: number; heightPct: number } {
  const safeAspect = aspectRatio > 0 ? aspectRatio : 1;

  let displayWidth = 1;
  let displayHeight = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (safeAspect >= 1) {
    displayHeight = 1 / safeAspect;
    offsetY = (1 - displayHeight) / 2;
  } else {
    displayWidth = safeAspect;
    offsetX = (1 - displayWidth) / 2;
  }

  const left = offsetX + box.x * displayWidth;
  const top = offsetY + box.y * displayHeight;
  const width = box.width * displayWidth;
  const height = box.height * displayHeight;

  return {
    leftPct: Math.max(0, Math.min(1, left)) * 100,
    topPct: Math.max(0, Math.min(1, top)) * 100,
    widthPct: Math.max(0, Math.min(1, width)) * 100,
    heightPct: Math.max(0, Math.min(1, height)) * 100,
  };
}

export default function CameraScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [showModelInfoModal, setShowModelInfoModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showLiveScanModal, setShowLiveScanModal] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  const savedScale = useRef(new Animated.Value(0)).current;
  const savedOpacity = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<VisionCamera | null>(null);
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraFormat = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const apiStatus = await InferenceService.loadModel();
        setModel(apiStatus);
        setModelLoaded(true);
      } catch (error) {
        console.error('Failed to initialize inference service:', error);
        Alert.alert(
          'Service Unavailable',
          'Could not initialize the inference service. Check network access and try again.'
        );
      }
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!hasCameraPermission) {
        await requestCameraPermission();
      }
    })();
  }, [hasCameraPermission, requestCameraPermission]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setShowModelInfoModal(true)}
          style={{ marginLeft: 16, padding: 8 }}
        >
          <MaterialIcons name="memory" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowGuideModal(true)}
          style={{ marginRight: 16, padding: 8 }}
        >
          <MaterialIcons name="menu-book" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [colors.primary, navigation]);

  const handleCapture = async () => {
    if (!hasCameraPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Needed', 'Camera permission is required for capture.');
        return;
      }
    }

    setShowLiveScanModal(true);
  };

  const closeLiveScan = () => {
    setShowLiveScanModal(false);
  };

  const captureLiveFrame = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({ enableShutterSound: false });
      const rawUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const ratio = await resolveImageAspectRatio(rawUri, photo.width, photo.height);
      setImageAspectRatio(ratio);
      setCapturedImage(rawUri);
      setCurrentResult(null);
      setShowLiveScanModal(false);
      await analyzeImage(rawUri);
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const rawUri = asset.uri;
        const ratio = await resolveImageAspectRatio(rawUri, asset.width, asset.height);
        setImageAspectRatio(ratio);
        setCapturedImage(rawUri);
        setCurrentResult(null);
        await analyzeImage(rawUri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  async function analyzeImage(imageUri?: string) {
    const uri = imageUri ?? capturedImage;
    if (!uri) {
      console.log('🔴 analyzeImage: No URI provided');
      return;
    }
    console.log('🟢 analyzeImage: Starting analysis for', uri);
    setIsProcessing(true);
    try {
      if (!modelLoaded || !model) {
        console.error('🔴 analyzeImage: Model not loaded', { modelLoaded, hasModel: !!model });
        Alert.alert('Model Not Ready', 'Waiting for local variety model to load.');
        return;
      }
      
      console.log('🔷 analyzeImage: Calling InferenceService.performInference...');
      const inferenceResult = await InferenceService.performInference(uri, model);
      console.log('🔷 analyzeImage: Inference result received:', {
        hasPineapple: inferenceResult.detection.hasPineapple,
        variety: inferenceResult.variety.label,
        confidence: inferenceResult.variety.confidence,
        quality: inferenceResult.quality.label,
        qualityConfidence: inferenceResult.quality.confidence,
        maturity: inferenceResult.maturity.label,
        maturityConfidence: inferenceResult.maturity.confidence,
        detectionError: inferenceResult.detection.error,
      });
      
      // Show "No Pineapple detected" if no detection
      if (!inferenceResult.detection.hasPineapple) {
        console.log('🟠 analyzeImage: No pineapple detected in image');
        if (inferenceResult.detection.error) {
          console.error('🔴 Detection error:', inferenceResult.detection.error);
        }
        setCurrentResult({
          confidence: 0,
          label: 'No Pineapple detected',
          timestamp: new Date().toISOString(),
          image: uri,
        });
        setShowResultModal(true);
        return;
      }
      
      console.log('🟢 analyzeImage: Pineapple detected! Processing results...');
      const result: ScanResult = {
        confidence: inferenceResult.variety.confidence,
        label: inferenceResult.variety.label,
        timestamp: new Date().toISOString(),
        image: uri,
        quality: inferenceResult.quality.label,
        qualityConfidence: inferenceResult.quality.confidence,
        maturity: inferenceResult.maturity.label !== 'Unknown' ? inferenceResult.maturity.label : undefined,
        maturityConfidence: inferenceResult.maturity.confidence,
      };
      setCurrentResult(result);
      setShowResultModal(true);
      console.log('🟢 analyzeImage: Result modal displayed');
    } catch (error) {
      console.error('🔴 analyzeImage: Exception caught:', error);
      Alert.alert('Error', `Failed to analyze image: ${String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  }

  const saveScan = async () => {
    if (!currentResult || currentResult.label === 'No Pineapple detected') return;
    setShowResultModal(false);
    try {
      await StorageService.saveScan({
        id: Math.random().toString(),
        variety: currentResult.label,
        confidence: currentResult.confidence,
        uri: currentResult.image,
        timestamp: currentResult.timestamp,
        quality: currentResult.quality || 'Extra Class',
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
    setShowConfidenceModal(false);
    setShowResultModal(false);
    setCapturedImage(null);
    setCurrentResult(null);
    setImageAspectRatio(1);
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
            <Text style={styles.scanningTitle}>Processing...</Text>
            <Text style={styles.scanningSubtitle}>Analyzing your captured pineapple image</Text>
          </View>
        </View>
      </Modal>

      {/* Capture Modal */}
      <Modal
        visible={showLiveScanModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeLiveScan}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.liveSheet}>
            <Text style={styles.resultTitle}>Capture</Text>

            <View style={styles.livePreviewArea}>
              {device && hasCameraPermission ? (
                <VisionCamera
                  ref={cameraRef}
                  style={styles.liveCamera}
                  device={device}
                  format={cameraFormat}
                  fps={30}
                  isActive={showLiveScanModal}
                  photo={true}
                  pixelFormat="yuv"
                />
              ) : (
                <View style={styles.liveCameraFallback}>
                  <Text style={styles.liveCameraFallbackText}>Camera not ready...</Text>
                </View>
              )}
            </View>

            <View style={styles.liveStatusRow}>
              <Text style={styles.liveStatusText}>
                Tap Capture to take a photo and analyze it.
              </Text>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={closeLiveScan} activeOpacity={0.8}>
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                <Text style={styles.retakeBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={captureLiveFrame}
                activeOpacity={0.8}
              >
                <MaterialIcons name="camera-alt" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Capture</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Model Info Modal (stays in Camera screen) */}
      <Modal visible={showModelInfoModal} transparent animationType="fade" onRequestClose={() => setShowModelInfoModal(false)}>
        <View style={styles.modelOverlay}>
          <View style={styles.modelSheet}>
            <TouchableOpacity
              style={styles.modelCloseIconBtn}
              onPress={() => setShowModelInfoModal(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={22} color={colors.error} />
            </TouchableOpacity>

            <Text style={styles.resultTitle}>Computer Vision Model</Text>

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
      </Modal>

      {/* Result Modal */}
      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultSheet}>
            {currentResult?.label === 'No Pineapple detected' ? (
              <>
                <Text style={[styles.resultTitle, { textAlign: 'center', marginBottom: 20 }]}>No Pineapple Detected</Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                    <MaterialIcons name="replay" size={18} color={colors.textSecondary} />
                    <Text style={styles.retakeBtnText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.resultTitle}>Scan Result</Text>

                {!!currentResult?.image && (
                  <View style={styles.resultImageWrap}>
                    <Image source={{ uri: currentResult.image }} style={styles.resultImage} />
                  </View>
                )}

                <View style={styles.resultRows}>
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Variety :</Text>
                    <Text style={styles.rowValue}>{currentResult?.label ?? '—'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Maturity :</Text>
                    <Text style={styles.rowValue}>{currentResult?.maturity ?? '—'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Quality :</Text>
                    <Text style={styles.rowValue}>{currentResult?.quality ?? '—'}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.rowLabel}>Confidence :</Text>
                    <TouchableOpacity
                      style={styles.viewConfidenceBtn}
                      onPress={() => setShowConfidenceModal(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="visibility" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                    <MaterialIcons name="replay" size={18} color={colors.textSecondary} />
                    <Text style={styles.retakeBtnText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={saveScan}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="save-alt" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
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
                  {currentResult ? `${(currentResult.confidence * 100).toFixed(2)}%` : '—'}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Maturity :</Text>
                <Text style={styles.rowValue}>
                  {currentResult?.maturityConfidence !== undefined
                    ? `${(currentResult.maturityConfidence * 100).toFixed(2)}%`
                    : '—'}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.rowLabel}>Quality :</Text>
                <Text style={styles.rowValue}>
                  {currentResult?.qualityConfidence !== undefined
                    ? `${(currentResult.qualityConfidence * 100).toFixed(2)}%`
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

      {/* Grading Standards Modal (book icon) */}
      <Modal visible={showGuideModal} transparent animationType="fade" onRequestClose={() => setShowGuideModal(false)}>
        <View style={styles.modelOverlay}>
          <View style={styles.guideSheet}>
            <TouchableOpacity
              style={styles.modelCloseIconBtn}
              onPress={() => setShowGuideModal(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={22} color={colors.error} />
            </TouchableOpacity>

            <Text style={styles.resultTitle}>Pineapple Grading Standard</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.guideContent}>
              <Text style={styles.guideSubTitle}>Variety Classification</Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colVariety]}>Variety</Text>
                <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.colVariety]}>Smooth Cayenne</Text>
                <Text style={[styles.tableCellText, styles.colDescription]}>Large fruit, cylindrical shape, smooth eyes, commonly used for processing</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.colVariety]}>Queen</Text>
                <Text style={[styles.tableCellText, styles.colDescription]}>Smaller fruit, conical shape, deep eyes, sweeter taste, often for fresh consumption</Text>
              </View>

              <Text style={styles.guideSubTitle}>Maturity Index</Text>
              <Text style={styles.guideBodyText}>Based on the percentage of yellow/orange color development on the pineapple skin.</Text>

              <Text style={styles.guideMinorTitle}>Smooth Cayenne</Text>
              <View style={styles.tableHeaderThree}>
                <Text style={[styles.tableHeaderText, styles.colIndex]}>Index</Text>
                <Text style={[styles.tableHeaderText, styles.colMaturity]}>Maturity</Text>
                <Text style={[styles.tableHeaderText, styles.colDescThree]}>Description</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>1-2</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Unripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Mostly green skin, not ready for consumption</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>3-4</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Ripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Partial yellowing, suitable for harvest and market</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>5-6</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Overripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Mostly yellow/orange, softer texture, shorter shelf life</Text>
              </View>

              <Text style={styles.guideMinorTitle}>Queen</Text>
              <View style={styles.tableHeaderThree}>
                <Text style={[styles.tableHeaderText, styles.colIndex]}>Index</Text>
                <Text style={[styles.tableHeaderText, styles.colMaturity]}>Maturity</Text>
                <Text style={[styles.tableHeaderText, styles.colDescThree]}>Description</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>1-2</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Unripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Green skin, immature and firm</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>3</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Ripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Balanced color development, best for consumption</Text>
              </View>
              <View style={styles.tableRowThree}>
                <Text style={[styles.tableCellText, styles.colIndex]}>4-5</Text>
                <Text style={[styles.tableCellText, styles.colMaturity]}>Overripe</Text>
                <Text style={[styles.tableCellText, styles.colDescThree]}>Advanced yellowing, very sweet but perishable</Text>
              </View>

              <Text style={styles.guideSubTitle}>Quality Grade</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colVariety]}>Grade</Text>
                <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.colVariety]}>Extra Class</Text>
                <Text style={[styles.tableCellText, styles.colDescription]}>Superior quality, well-formed, free from defects, premium market grade</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.colVariety]}>Class I</Text>
                <Text style={[styles.tableCellText, styles.colDescription]}>Good quality, slight defects allowed, still visually acceptable</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.colVariety]}>Class II</Text>
                <Text style={[styles.tableCellText, styles.colDescription]}>Acceptable quality, visible defects, suitable for general consumption</Text>
              </View>

              <Text style={styles.guideBodyText}>
                This grading system follows standard pineapple classification based on variety, maturity index, and quality grade. Maturity is determined by external color development, while quality is evaluated based on physical appearance and defects.
              </Text>
              <Text style={styles.guideBodyText}>
                These standards help identify the market suitability and overall condition of the fruit.
              </Text>

              <Text style={styles.guideFooter}>Based on Philippine National Standard (PNS) for Pineapple</Text>
            </ScrollView>
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
    resizeMode: 'contain',
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

  modelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modelSheet: {
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
  guideSheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxHeight: '86%',
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelCloseIconBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 2,
    padding: 4,
  },
  guideContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  guideSubTitle: {
    ...Typography.bodySemiBold,
    color: colors.text,
    fontSize: 16,
    marginTop: Spacing.xs,
  } as any,
  guideMinorTitle: {
    ...Typography.bodySemiBold,
    color: colors.text,
    marginTop: Spacing.xs,
  } as any,
  guideBodyText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  } as any,
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  tableHeaderThree: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  tableRowThree: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  tableHeaderText: {
    ...Typography.bodySemiBold,
    color: colors.text,
    fontSize: 12,
  } as any,
  tableCellText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  } as any,
  colVariety: {
    flex: 1,
  },
  colDescription: {
    flex: 2.2,
  },
  colIndex: {
    flex: 0.8,
  },
  colMaturity: {
    flex: 1.1,
  },
  colDescThree: {
    flex: 2.1,
  },
  guideFooter: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  } as any,

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
  resultImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  resultBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  resultBoxLabel: {
    position: 'absolute',
    top: -22,
    left: 0,
    color: '#fff',
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
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
  saveBtnDisabled: {
    opacity: 0.45,
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

  liveSheet: {
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
  livePreviewArea: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  liveCamera: {
    flex: 1,
  },
  liveCameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  liveCameraFallbackText: {
    ...Typography.bodySmall,
    color: '#e5e7eb',
  } as any,
  liveBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  liveBoxLabelWrap: {
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveBoxLabel: {
    ...Typography.caption,
    color: '#fff',
    fontSize: 11,
  } as any,
  liveStatusRow: {
    marginBottom: Spacing.lg,
  },
  liveStatusText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  } as any,
});

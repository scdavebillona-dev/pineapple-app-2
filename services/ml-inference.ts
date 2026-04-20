/**
 * ML Inference Service
 * Variety: local ONNX model
 * Quality + Maturity: Roboflow online APIs
 */

import { toByteArray } from 'base64-js';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import type * as ORT from 'onnxruntime-react-native';
import { Platform } from 'react-native';

interface ModelOutput {
  label: string;
  confidence: number;
  classIndex: number;
}

export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classIndex: number;
  label: string;
}

export interface VarietyOnlyInferenceResult {
  variety: ModelOutput;
  detection: {
    hasPineapple: boolean;
    predictions: number;
    error?: string;
  };
  boxes: DetectionBox[];
}

/**
 * Combined inference output with variety, quality, maturity, and detection
 */
export interface InferenceResult {
  variety: ModelOutput;
  quality: ModelOutput;
  maturity: ModelOutput;
  boxes: DetectionBox[];
  detection: {
    hasPineapple: boolean;
    predictions: number;
    error?: string;
  };
}

interface PreprocessedFrame {
  tensor: Float32Array;
  width: number;
  height: number;
  isChw: boolean;
}

type LoadedModelState = {
  loaded: true;
  modelName: string;
  framework: string;
  mode: 'onnx' | 'api-fallback';
  varietySession?: ORT.InferenceSession;
  inputName?: string;
  outputName?: string;
  inputShape?: number[];
  outputShape?: number[];
};

type ParseContext = {
  inputWidth: number;
  inputHeight: number;
};

// Pineapple variety class labels
const VARIETY_LABELS = [
  // Runtime export mapping observed from the deployed model:
  // class 0 -> Queen, class 1 -> Smooth Cayenne
  'Queen',
  'Smooth Cayenne',
  'No Pineapple',
];

const YOLO_CONF_THRESHOLD = 0.05; // Lowered for debugging
const ENABLE_DEBUG_LOGS = false;  // 🔍 Disabled noisy logs - check console for focus
const FAST_INFERENCE_MODE = false;
const VARIETY_MODEL_ASSET = require('../assets/model/variety.onnx');
const FORCE_API_FALLBACK = false; // 🧪 Change to true to test if the Roboflow API gets it right every time

// Pineapple quality class labels
const QUALITY_LABELS = [
  'Class I',
  'Class II',
  'Extra Class',
  'Reject',
];

// Pineapple maturity class labels
const MATURITY_LABELS = [
  'Unripe',
  'Underripe',
  'Ripe',
  'Overripe',
];

/**
 * Normalize variety class names from Roboflow
 */
function normalizeVarietyClassName(className: string): string {
  if (!className) return 'Unknown';
  const lowerClass = className.toLowerCase().trim();
  if (
    lowerClass.includes('no pineapple') ||
    lowerClass.includes('not pineapple') ||
    lowerClass.includes('non-pineapple') ||
    lowerClass.includes('non pineapple') ||
    lowerClass.includes('background') ||
    lowerClass.includes('none')
  ) {
    return 'No Pineapple';
  }
  if (lowerClass.includes('queen')) return 'Queen';
  if (lowerClass.includes('cayenne') || lowerClass.includes('cayene') || lowerClass.includes('smooth')) return 'Smooth Cayenne';
  return className;
}

/**
 * Normalize maturity class names from Roboflow
 */
function normalizeMaturityClassName(className: string): string {
  if (!className) return 'Unknown';
  const lowerClass = className.toLowerCase().trim();
  if (lowerClass.includes('overripe') || lowerClass.includes('over')) return 'Overripe';
  if (lowerClass.includes('underripe') || lowerClass.includes('under')) return 'Underripe';
  if (lowerClass.includes('unripe')) return 'Unripe';
  if (lowerClass.includes('ripe')) return 'Ripe';
  return className;
}

/**
 * Normalize quality class names from Roboflow
 */
function normalizeQualityClassName(className: string): string {
  if (!className) return 'Unknown';
  const lowerClass = className.toLowerCase().trim();
  if (lowerClass.includes('class') && lowerClass.includes('i') && !lowerClass.includes('ii')) return 'Class I';
  if (lowerClass.includes('class') && (lowerClass.includes('ii') || lowerClass.includes('2'))) return 'Class II';
  if (lowerClass.includes('extra')) return 'Extra Class';
  if (lowerClass.includes('reject')) return 'Reject';
  return className;
}

// Roboflow API Configuration
const ROBOFLOW_API_KEY = 'P1f8r2nKTs3WwrwEclON';
const VARIETY_MODEL_ID = 'pineapple-variety-honut/4';
const QUALITY_MODEL_ID = 'pineapple_quality/2';
const MATURITY_MODEL_ID = 'maturity-kahvp/2';
const VARIETY_API_URL = `https://classify.roboflow.com/${VARIETY_MODEL_ID}`;
const QUALITY_API_URL = `https://detect.roboflow.com/${QUALITY_MODEL_ID}`;
const MATURITY_API_URL = `https://classify.roboflow.com/${MATURITY_MODEL_ID}`;

let cachedVarietyModel: LoadedModelState | null = null;
let modelLoadPromise: Promise<LoadedModelState> | null = null;

function nowMs(): number {
  return Date.now();
}

/**
 * Load local ONNX variety model.
 */
export async function loadModel() {
  if (cachedVarietyModel) {
    return cachedVarietyModel;
  }

  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = (async () => {
  try {
    console.log('Loading local ONNX variety model...');
    const startedAt = nowMs();

    if (FORCE_API_FALLBACK) {
      console.log('🧪 FORCE_API_FALLBACK is true. Bypassing ONNX loading.');
      throw new Error('Forced API Fallback for debugging');
    }

    if (Platform.OS === 'web') {
      throw new Error('ONNX Runtime is not supported on web in this app');
    }

    if (Constants.appOwnership === 'expo') {
      throw new Error('ONNX Runtime requires an Android development build, not Expo Go');
    }

    const asset = Asset.fromModule(VARIETY_MODEL_ASSET);
    await asset.downloadAsync();
    const modelUri = asset.localUri ?? asset.uri;
    if (!modelUri) {
      throw new Error('Failed to resolve ONNX model asset URI');
    }

    const ortModule = require('onnxruntime-react-native') as typeof import('onnxruntime-react-native');
    const InferenceSession = ortModule.InferenceSession ?? (ortModule as any).default?.InferenceSession;
    const Tensor = ortModule.Tensor ?? (ortModule as any).default?.Tensor;

    if (!InferenceSession || !Tensor) {
      throw new Error('ONNX Runtime native module is unavailable in this build');
    }

    const varietySession = await InferenceSession.create(modelUri);
    const inputName = varietySession.inputNames[0];
    const outputName = varietySession.outputNames[0];
    let inputShape = [1, 3, 640, 640];

    try {
      const inputMeta = (varietySession as any).inputMetadata?.[inputName];
      if (inputMeta && Array.isArray(inputMeta.dimensions)) {
        const dims = inputMeta.dimensions.map((d: any) =>
          typeof d === 'number' && d > 0 ? d : -1
        );
        if (dims.length === 4) {
          inputShape = dims;
        }
      }
    } catch (e) {
      console.warn('Could not read inputMetadata dynamically', e);
    }
    
    // 3. Capture the real output shape from the ONNX session safely casting to any to avoid TS errors
    let outputShape: number[] = [];
    try {
      const outputMeta = (varietySession as any).outputMetadata?.[outputName];
      if (outputMeta && Array.isArray(outputMeta.dimensions)) {
        outputShape = outputMeta.dimensions.map((d: any) => typeof d === 'number' && d > 0 ? d : -1);
      }
    } catch (e) {
      console.warn('Could not read outputMetadata dynamically', e);
    }

    const loadedState: LoadedModelState = {
      varietySession,
      loaded: true,
      modelName: 'variety.onnx',
      framework: 'ONNX Runtime + Roboflow APIs',
      mode: 'onnx',
      inputName,
      outputName,
      inputShape,
      outputShape,
    };

    cachedVarietyModel = loadedState;
    console.log(`ONNX model loaded in ${nowMs() - startedAt} ms`);

    return loadedState;
  } catch (error) {
    console.error('Failed to load local ONNX variety model:', error);
    const fallbackState: LoadedModelState = {
      loaded: true,
      modelName: 'Roboflow API fallback',
      framework: 'Roboflow APIs',
      mode: 'api-fallback',
    };
    cachedVarietyModel = fallbackState;
    return fallbackState;
  }
  })();

  try {
    return await modelLoadPromise;
  } finally {
    modelLoadPromise = null;
  }
}

export async function preloadModels(): Promise<LoadedModelState> {
  return loadModel();
}

export async function runInference(
  model: LoadedModelState,
  preprocessedFrame: PreprocessedFrame
): Promise<ModelOutput> {
  const raw = await runVarietyModelRaw(model, preprocessedFrame);
  return extractVarietyPrediction(raw);
}

async function runVarietyModelRaw(
  model: LoadedModelState,
  preprocessedFrame: PreprocessedFrame
): Promise<Float32Array> {
  if (!model.varietySession || !model.inputName || !model.outputName) {
    throw new Error('ONNX model is not available in this build');
  }

  const ortModule = require('onnxruntime-react-native') as typeof import('onnxruntime-react-native');
  const Tensor = ortModule.Tensor ?? (ortModule as any).default?.Tensor;
  if (!Tensor) {
    throw new Error('ONNX Runtime native module is unavailable in this build');
  }
  const shape = preprocessedFrame.isChw
    ? [1, 3, preprocessedFrame.height, preprocessedFrame.width]
    : [1, preprocessedFrame.height, preprocessedFrame.width, 3];

  const inputTensor = new Tensor('float32', preprocessedFrame.tensor, shape);
  const outputs = await model.varietySession.run({
    [model.inputName]: inputTensor,
  });

  const outputTensor = outputs[model.outputName] ?? Object.values(outputs)[0];
  if (!outputTensor) {
    throw new Error('No output from ONNX variety model');
  }

  return outputTensor.data instanceof Float32Array
    ? outputTensor.data
    : new Float32Array(outputTensor.data as ArrayLike<number>);
}

/**
 * Post-process Roboflow classify API response for variety
 */
function postprocessVarietyOutput(apiResponse: any): ModelOutput {
  try {
    if (!apiResponse) {
      return {
        label: 'No Pineapple',
        confidence: 0,
        classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
      };
    }

    let topPrediction = 'No Pineapple';
    let topConfidence = 0;

    if (apiResponse.top) {
      topPrediction = normalizeVarietyClassName(apiResponse.top);
      topConfidence = apiResponse.confidence || 0;
    } else {
      const predictions = apiResponse.predictions || [];
      if (Array.isArray(predictions)) {
        for (const pred of predictions) {
          const confidence = pred.confidence || 0;
          const className = normalizeVarietyClassName(pred.class || 'Unknown');
          if (confidence > topConfidence) {
            topConfidence = confidence;
            topPrediction = className;
          }
        }
      }
    }

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: VARIETY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('Variety post-processing error:', error);
    return {
      label: 'No Pineapple',
      confidence: 0,
      classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
    };
  }
}

/**
 * Post-process Roboflow API response for quality
 */
function postprocessQualityOutput(apiResponse: any): ModelOutput {
  try {
    if (!apiResponse) {
      return {
        label: 'Unknown',
        confidence: 0,
        classIndex: -1,
      };
    }

    const predictions = apiResponse.predictions || [];
    let topPrediction = 'Unknown';
    let topConfidence = 0;
    
    if (predictions.length > 0) {
      for (const pred of predictions) {
        const confidence = pred.confidence || 0;
        const className = normalizeQualityClassName(pred.class || 'Unknown');
        
        if (confidence > topConfidence) {
          topConfidence = confidence;
          topPrediction = className;
        }
      }
    }

    console.log(`Quality: ${topPrediction} (${(topConfidence * 100).toFixed(1)}%)`);

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: QUALITY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('Quality post-processing error:', error);
    return {
      label: 'Unknown',
      confidence: 0,
      classIndex: -1,
    };
  }
}

/**
 * Post-process Roboflow classify API response for maturity
 */
function postprocessMaturityOutput(apiResponse: any): ModelOutput {
  try {
    if (!apiResponse) {
      return {
        label: 'Unknown',
        confidence: 0,
        classIndex: -1,
      };
    }

    // Classification API returns { top, confidence, predictions: [{class, confidence}] }
    let topPrediction = 'Unknown';
    let topConfidence = 0;

    if (apiResponse.top) {
      topPrediction = normalizeMaturityClassName(apiResponse.top);
      topConfidence = apiResponse.confidence || 0;
    } else {
      const predictions = apiResponse.predictions || [];
      if (Array.isArray(predictions)) {
        for (const pred of predictions) {
          const c = pred.confidence || 0;
          const cl = normalizeMaturityClassName(pred.class || 'Unknown');
          if (c > topConfidence) {
            topConfidence = c;
            topPrediction = cl;
          }
        }
      } else {
        for (const [cls, val] of Object.entries(predictions)) {
          const c = (val as any).confidence ?? (typeof val === 'number' ? val : 0);
          if (c > topConfidence) {
            topConfidence = c;
            topPrediction = normalizeMaturityClassName(cls);
          }
        }
      }
    }

    console.log(`Maturity: ${topPrediction} (${(topConfidence * 100).toFixed(1)}%)`);

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: MATURITY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('Maturity post-processing error:', error);
    return {
      label: 'Unknown',
      confidence: 0,
      classIndex: -1,
    };
  }
}

export async function preprocessFrame(
  imageUri: string,
  inputShape: number[]
): Promise<PreprocessedFrame> {
  const isChw = inputShape.length === 4 && inputShape[1] === 3;
  const targetWidth = 640;
  const targetHeight = 640;

  try {
    // Read original image as base64: no resize and no re-encoding here.
    let base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    if (base64.includes(',')) {
      base64 = base64.split(',')[1];
    }
    base64 = base64.trim();

    if (!base64 || base64.length < 100) {
      console.error('🔴 [preprocessFrame] Base64 too short:', base64.length);
      throw new Error(`Invalid base64: length ${base64.length}`);
    }

    // Convert PNG to JPEG only when needed, while keeping original resolution.
    if (base64.startsWith('iVBORw0KGgo')) {
      console.log('📸 [preprocessFrame] Original image is PNG, converting to JPEG once...');
      const converted = await manipulateAsync(
        imageUri,
        [],
        { format: SaveFormat.JPEG, compress: 1, base64: true }
      );

      if (!converted.base64) {
        throw new Error('Failed to convert PNG to JPEG');
      }

      base64 = converted.base64;
      if (base64.includes(',')) {
        base64 = base64.split(',')[1];
      }
      base64 = base64.trim();
    }

    if (!base64.startsWith('/9j')) {
      console.error('🔴 [preprocessFrame] Base64 is not JPEG. Starts with:', base64.substring(0, 20));
      throw new Error('Invalid JPEG base64');
    }

    const imageBytes = toByteArray(base64);
    console.log('🔷 [preprocessFrame] Source image bytes length:', imageBytes.length);
    
    if (imageBytes.length < 10) {
      throw new Error(`Invalid image bytes: length ${imageBytes.length}`);
    }

    // Check for JPEG SOI marker (0xFFD8)
    const byte0Hex = imageBytes[0].toString(16).padStart(2, '0');
    const byte1Hex = imageBytes[1].toString(16).padStart(2, '0');
    
    if (imageBytes[0] !== 0xFF || imageBytes[1] !== 0xD8) {
      console.error(`🔴 [preprocessFrame] Missing JPEG SOI marker. Got: 0x${byte0Hex}${byte1Hex}, expected 0xffd8`);
      throw new Error(`Invalid JPEG: SOI marker not found at offset 0. Got 0x${byte0Hex}${byte1Hex}`);
    }

    console.log('🔷 [preprocessFrame] JPEG SOI marker found, decoding original image...');
    const decoded = jpeg.decode(imageBytes, { useTArray: true, maxResolutionInMP: 100 });
    const { width: srcWidth, height: srcHeight, data } = decoded;
    console.log('🔷 [preprocessFrame] JPEG decoded successfully, source size:', srcWidth, 'x', srcHeight);

    const tensor = new Float32Array(3 * targetWidth * targetHeight);
    const hw = targetWidth * targetHeight;

    const scaleX = srcWidth / targetWidth;
    const scaleY = srcHeight / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      const srcY = (y + 0.5) * scaleY - 0.5;
      const y1 = Math.max(0, Math.floor(srcY));
      const y2 = Math.min(y1 + 1, srcHeight - 1);
      const wy = srcY - y1;

      for (let x = 0; x < targetWidth; x++) {
        const srcX = (x + 0.5) * scaleX - 0.5;
        const x1 = Math.max(0, Math.floor(srcX));
        const x2 = Math.min(x1 + 1, srcWidth - 1);
        const wx = srcX - x1;

        const p11 = (y1 * srcWidth + x1) * 4;
        const p12 = (y1 * srcWidth + x2) * 4;
        const p21 = (y2 * srcWidth + x1) * 4;
        const p22 = (y2 * srcWidth + x2) * 4;

        for (let c = 0; c < 3; c++) {
          const v11 = data[p11 + c];
          const v12 = data[p12 + c];
          const v21 = data[p21 + c];
          const v22 = data[p22 + c];

          const val =
            (1 - wy) * ((1 - wx) * v11 + wx * v12) +
            wy * ((1 - wx) * v21 + wx * v22);

          const normVal = val / 255.0;

          if (isChw) {
            tensor[c * hw + y * targetWidth + x] = normVal;
          } else {
            tensor[(y * targetWidth + x) * 3 + c] = normVal;
          }
        }
      }
    }

    console.log('🟢 [preprocessFrame] Preprocessing complete, tensor created');
    return {
      tensor,
      width: targetWidth,
      height: targetHeight,
      isChw,
    };
  } catch (error) {
    console.error('🔴 [preprocessFrame] Error during preprocessing:', error);
    throw error;
  }
}

/**
 * Infer pineapple presence from variety output.
 * If variety predicts "No Pineapple", detection is false.
 */
function detectionFromVariety(variety: ModelOutput): { hasPineapple: boolean; predictions: number; error?: string } {
  const label = variety.label?.toLowerCase().trim();
  const hasPineapple =
    label !== 'no pineapple' &&
    label !== 'unknown' &&
    label !== 'error' &&
    variety.confidence >= YOLO_CONF_THRESHOLD;
  if (!hasPineapple) {
    console.log('⚠️  No pineapple detected from variety model output');
    return { hasPineapple: false, predictions: 0 };
  }
  return { hasPineapple: true, predictions: 1 };
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function normalizeScores(raw: Float32Array): Float32Array {
  if (raw.length === 0) return raw;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;

  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const likelyProbabilities = min >= 0 && max <= 1 && sum > 0.98 && sum < 1.02;
  if (likelyProbabilities) {
    return raw;
  }

  const exps = new Float32Array(raw.length);
  let expSum = 0;
  for (let i = 0; i < raw.length; i++) {
    const e = Math.exp(raw[i] - max);
    exps[i] = e;
    expSum += e;
  }

  if (expSum === 0) return exps;

  for (let i = 0; i < exps.length; i++) {
    exps[i] = exps[i] / expSum;
  }
  return exps;
}

function extractVarietyPrediction(raw: Float32Array): ModelOutput {
  const parsedBoxes = parseYoloBoxes(raw, [1, raw.length]);
  if (parsedBoxes.length > 0) {
    const best = parsedBoxes[0];
    return {
      label: best.label,
      confidence: best.confidence,
      classIndex: best.classIndex,
    };
  }

  const probabilities = normalizeScores(raw);
  const limit = Math.min(probabilities.length, VARIETY_LABELS.length);

  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < limit; i++) {
    const score = probabilities[i];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0) {
    return {
      label: VARIETY_LABELS[bestIndex],
      confidence: clamp01(bestScore),
      classIndex: bestIndex,
    };
  }

  return {
    label: 'Unknown',
    confidence: 0,
    classIndex: -1,
  };
}

async function runLocalVarietyInference(imageUri: string, model: LoadedModelState): Promise<ModelOutput> {
  const startedAt = nowMs();
  const inputShape = model.inputShape;
  if (!inputShape) {
    const base64 = await imageUriToBase64(imageUri);
    const varietyResponse = await callRoboflowAPI(base64, VARIETY_API_URL, 'Variety Model').catch(err => {
      console.error('Variety API failed:', err);
      return null;
    });
    const result = postprocessVarietyOutput(varietyResponse);
    console.log(`Variety API inference took ${nowMs() - startedAt} ms`);
    return result;
  }

  const preprocessed = await preprocessFrame(imageUri, inputShape);
  const raw = await runVarietyModelRaw(model, preprocessed);

  console.log('[DEBUG] ONNX shape from metadata:', model.outputShape);
  console.log('[DEBUG] First 20 raw outputs:', Array.from(raw.slice(0, 20)).map(n => n.toFixed(4)).join(', '));
  
  const localResult = extractVarietyPrediction(raw);
  const normalized = normalizeVarietyClassName(localResult.label);

  console.log(`Variety ONNX inference took ${nowMs() - startedAt} ms`);

  return {
    ...localResult,
    label: normalized,
    classIndex: VARIETY_LABELS.indexOf(normalized),
  };
}

function toNormalizedBox(
  xCenter: number,
  yCenter: number,
  boxWidth: number,
  boxHeight: number,
  inputWidth: number,
  inputHeight: number
) {
  const needsScaling = xCenter > 2 || yCenter > 2 || boxWidth > 2 || boxHeight > 2;
  const scaleX = needsScaling ? inputWidth : 1;
  const scaleY = needsScaling ? inputHeight : 1;

  const x = clamp01((xCenter - boxWidth / 2) / scaleX);
  const y = clamp01((yCenter - boxHeight / 2) / scaleY);
  const w = clamp01(boxWidth / scaleX);
  const h = clamp01(boxHeight / scaleY);

  return {
    x,
    y,
    width: clamp01(Math.min(w, 1 - x)),
    height: clamp01(Math.min(h, 1 - y)),
  };
}

function parseDetectionsNx6(raw: Float32Array, ctx: ParseContext): DetectionBox[] {
  const boxes: DetectionBox[] = [];
  if (raw.length < 6 || raw.length % 6 !== 0) return boxes;

  const rows = raw.length / 6;
  for (let i = 0; i < rows; i++) {
    const base = i * 6;
    const confidence = raw[base + 4];
    if (confidence < YOLO_CONF_THRESHOLD) continue;

    const classIndex = Math.round(raw[base + 5]);
    if (classIndex < 0 || classIndex >= VARIETY_LABELS.length) continue;

    const x1 = raw[base];
    const y1 = raw[base + 1];
    const x2 = raw[base + 2];
    const y2 = raw[base + 3];
    const absW = Math.max(0, x2 - x1);
    const absH = Math.max(0, y2 - y1);

    const norm = toNormalizedBox(
      x1 + absW / 2,
      y1 + absH / 2,
      absW,
      absH,
      ctx.inputWidth,
      ctx.inputHeight
    );
    if (norm.width <= 0.01 || norm.height <= 0.01) continue;

    boxes.push({
      ...norm,
      confidence,
      classIndex,
      label: VARIETY_LABELS[classIndex],
    });
  }

  return nms(boxes);
}

function parseDetections1x84xN(raw: Float32Array, anchors: number, ctx: ParseContext): DetectionBox[] {
  const boxes: DetectionBox[] = [];
  if (anchors <= 0 || raw.length !== 84 * anchors) return boxes;

  for (let i = 0; i < anchors; i++) {
    const objConf = raw[4 * anchors + i];
    if (objConf < YOLO_CONF_THRESHOLD) continue;

    let bestClass = -1;
    let bestClassScore = Number.NEGATIVE_INFINITY;
    for (let c = 0; c < 79; c++) {
      const classScore = raw[(5 + c) * anchors + i];
      if (classScore > bestClassScore) {
        bestClassScore = classScore;
        bestClass = c;
      }
    }

    const confidence = objConf * bestClassScore;
    if (confidence < YOLO_CONF_THRESHOLD) continue;
    if (bestClass < 0 || bestClass >= VARIETY_LABELS.length) continue;

    const cx = raw[i];
    const cy = raw[anchors + i];
    const w = raw[2 * anchors + i];
    const h = raw[3 * anchors + i];
    const norm = toNormalizedBox(cx, cy, w, h, ctx.inputWidth, ctx.inputHeight);
    if (norm.width <= 0.01 || norm.height <= 0.01) continue;

    boxes.push({
      ...norm,
      confidence,
      classIndex: bestClass,
      label: VARIETY_LABELS[bestClass],
    });
  }

  return nms(boxes);
}

function parseDetections1xNx84(raw: Float32Array, anchors: number, ctx: ParseContext): DetectionBox[] {
  const boxes: DetectionBox[] = [];
  if (anchors <= 0 || raw.length !== anchors * 84) return boxes;

  for (let i = 0; i < anchors; i++) {
    const base = i * 84;
    const objConf = raw[base + 4];
    if (objConf < YOLO_CONF_THRESHOLD) continue;

    let bestClass = -1;
    let bestClassScore = Number.NEGATIVE_INFINITY;
    for (let c = 0; c < 79; c++) {
      const classScore = raw[base + 5 + c];
      if (classScore > bestClassScore) {
        bestClassScore = classScore;
        bestClass = c;
      }
    }

    const confidence = objConf * bestClassScore;
    if (confidence < YOLO_CONF_THRESHOLD) continue;
    if (bestClass < 0 || bestClass >= VARIETY_LABELS.length) continue;

    const cx = raw[base];
    const cy = raw[base + 1];
    const w = raw[base + 2];
    const h = raw[base + 3];
    const norm = toNormalizedBox(cx, cy, w, h, ctx.inputWidth, ctx.inputHeight);
    if (norm.width <= 0.01 || norm.height <= 0.01) continue;

    boxes.push({
      ...norm,
      confidence,
      classIndex: bestClass,
      label: VARIETY_LABELS[bestClass],
    });
  }

  return nms(boxes);
}

function iou(a: DetectionBox, b: DetectionBox): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const interX1 = Math.max(a.x, b.x);
  const interY1 = Math.max(a.y, b.y);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - interArea;
  if (union <= 0) return 0;

  return interArea / union;
}

function nms(boxes: DetectionBox[], threshold = 0.45): DetectionBox[] {
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence);
  const picked: DetectionBox[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    picked.push(current);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iou(current, sorted[i]) > threshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return picked;
}

function parseYoloBoxes(
  raw: Float32Array,
  outputShape?: number[],
  ctx: ParseContext = { inputWidth: 640, inputHeight: 640 }
): DetectionBox[] {
  const shape = outputShape ?? [];

  // Case: [1, num_dets, 6] or [num_dets, 6]
  if (shape.length === 3 && shape[2] === 6) {
    return parseDetectionsNx6(raw, ctx);
  }
  if (shape.length === 2 && shape[1] === 6) {
    return parseDetectionsNx6(raw, ctx);
  }
  if (shape.length === 1 && raw.length % 6 === 0) {
    return parseDetectionsNx6(raw, ctx);
  }

  // Case: [1, 84, num_anchors]
  if (shape.length === 3 && shape[1] === 84 && Number.isFinite(shape[2])) {
    return parseDetections1x84xN(raw, shape[2], ctx);
  }

  // Case: [1, num_anchors, 84]
  if (shape.length === 3 && shape[2] === 84 && Number.isFinite(shape[1])) {
    return parseDetections1xNx84(raw, shape[1], ctx);
  }

  // Fallback heuristics when shape metadata is unknown
  if (raw.length % 6 === 0) {
    return parseDetectionsNx6(raw, ctx);
  }
  if (raw.length % 84 === 0) {
    const anchors = raw.length / 84;
    return parseDetections1xNx84(raw, anchors, ctx);
  }

  return [];
}

export async function performVarietyOnlyInference(
  imageUri: string,
  model: any
): Promise<VarietyOnlyInferenceResult> {
  try {
    console.log('🔷 [Inference] Starting variety analysis...');
    const varietyModel: LoadedModelState | null = model?.loaded ? model : cachedVarietyModel;
    if (!varietyModel) {
      console.error('🔴 [Inference] No variety model loaded');
      throw new Error('Variety ONNX model not loaded');
    }

    const inputShape = varietyModel.inputShape;
    
    if (!inputShape || !varietyModel.varietySession) {
      console.log('⚠️  [Inference] ONNX not available, using Roboflow API fallback...');
      const base64 = await imageUriToBase64(imageUri);
      const varietyResponse = await callRoboflowAPI(base64, VARIETY_API_URL, 'Variety Model').catch(err => {
        console.error('❌ Variety API failed:', err);
        return null;
      });
      const varietyResult = postprocessVarietyOutput(varietyResponse);
      return {
        variety: varietyResult,
        detection: detectionFromVariety(varietyResult),
        boxes: [],
      };
    }

    console.log('🔷 [Inference] Preprocessing image...');
    const preprocessed = await preprocessFrame(imageUri, inputShape);
    
    console.log('🔷 [Inference] Running ONNX inference...');
    const raw = await runVarietyModelRaw(varietyModel, preprocessed);
    console.log('🔷 [Inference] Output shape from metadata:', varietyModel.outputShape);
    console.log('🔷 [Inference] Model output length:', raw.length);

    const parsedBoxes = parseYoloBoxes(raw, varietyModel.outputShape, {
      inputWidth: preprocessed.width,
      inputHeight: preprocessed.height,
    });
    console.log('🔷 [Inference] Detected', parsedBoxes.length, 'boxes');

    let varietyResult: ModelOutput;
    if (parsedBoxes.length > 0) {
      const top = [...parsedBoxes].sort((a, b) => b.confidence - a.confidence)[0];
      varietyResult = {
        label: top.label,
        confidence: top.confidence,
        classIndex: top.classIndex,
      };
      console.log('✅ [Inference] Detected:', varietyResult.label, `(${(varietyResult.confidence * 100).toFixed(1)}%)`);
    } else {
      varietyResult = {
        label: 'No Pineapple',
        confidence: 0,
        classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
      };
      console.log('⚠️  [Inference] No pineapple found in image');
    }

    const detection = parsedBoxes.length > 0
      ? { hasPineapple: true, predictions: parsedBoxes.length }
      : { hasPineapple: false, predictions: 0 };

    return {
      variety: varietyResult,
      detection,
      boxes: parsedBoxes,
    };
  } catch (error) {
    console.error('🔴 [Inference] ERROR:', error);
    return {
      variety: {
        label: 'Inference Failed',
        confidence: 0,
        classIndex: -1,
      },
      detection: {
        hasPineapple: false,
        predictions: 0,
        error: String(error),
      },
      boxes: [],
    };
  }
}

/**
 * Call single Roboflow API endpoint
 */
async function callRoboflowAPI(
  base64: string,
  apiUrl: string,
  modelName: string
): Promise<any> {
  try {
    console.log(`📤 Calling ${modelName}...`);
    const startedAt = nowMs();
    
    const response = await fetch(`${apiUrl}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64,
    });

    if (response.status === 403) {
      throw new Error('API key invalid or expired');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${modelName} Error:`, errorText);
      throw new Error(`API error ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log(`✅ ${modelName} Response received in ${nowMs() - startedAt} ms`);
    return apiResponse;
  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error);
    throw error;
  }
}

/**
 * Complete inference pipeline: Call variety, quality, and maturity APIs in parallel.
 * Pineapple detection is based on variety output.
 */
export async function performInference(
  imageUri: string,
  model: any
): Promise<InferenceResult> {
  const pipelineStartedAt = nowMs();
  try {
    console.log('🟢 UPLOAD ANALYSIS STARTED');
    const varietyModel: LoadedModelState | null = model?.loaded ? model : cachedVarietyModel;
    if (!varietyModel) {
      console.error('🔴 No variety model loaded');
      throw new Error('Variety ONNX model not loaded');
    }

    const varietyOnlyResult = await performVarietyOnlyInference(imageUri, varietyModel);
    const varietyResult = varietyOnlyResult.variety;
    const detectionResult = varietyOnlyResult.detection;
    const boxes = varietyOnlyResult.boxes;

    if (!detectionResult.hasPineapple) {
      console.log('🟠 No pineapple detected');
      return {
        variety: {
          label: 'No Pineapple',
          confidence: varietyResult.confidence,
          classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
        },
        quality: {
          label: 'Unknown',
          confidence: 0,
          classIndex: -1,
        },
        maturity: {
          label: 'Unknown',
          confidence: 0,
          classIndex: -1,
        },
        boxes,
        detection: detectionResult,
      };
    }

    if (FAST_INFERENCE_MODE) {
      console.log('🟡 Fast mode: skipping quality/maturity');
      return {
        variety: varietyResult,
        quality: {
          label: 'Unknown',
          confidence: 0,
          classIndex: -1,
        },
        maturity: {
          label: 'Unknown',
          confidence: 0,
          classIndex: -1,
        },
        boxes,
        detection: detectionResult,
      };
    }

    const base64 = await imageUriToBase64(imageUri);
    console.log('📤 Calling quality & maturity APIs...');

    const [qualityResponse, maturityResponse] = await Promise.all([
      callRoboflowAPI(base64, QUALITY_API_URL, 'Quality Model').catch(err => {
        console.error('❌ Quality API failed:', err);
        return null;
      }),
      callRoboflowAPI(base64, MATURITY_API_URL, 'Maturity Model').catch(err => {
        console.error('❌ Maturity API failed:', err);
        return null;
      }),
    ]);

    const qualityResult = postprocessQualityOutput(qualityResponse);
    const maturityResult = postprocessMaturityOutput(maturityResponse);
    const totalTime = nowMs() - pipelineStartedAt;
    console.log(`✅ ANALYSIS COMPLETE (${totalTime}ms) - ${varietyResult.label}, Quality: ${qualityResult.label}, Maturity: ${maturityResult.label}`);
    
    return {
      variety: varietyResult,
      quality: qualityResult,
      maturity: maturityResult,
      boxes,
      detection: detectionResult,
    };
  } catch (error) {
    const totalTime = nowMs() - pipelineStartedAt;
    console.error('🔴 Pipeline error after', totalTime, 'ms:', error);
    return {
      variety: {
        label: 'Inference Failed',
        confidence: 0,
        classIndex: -1,
      },
      quality: {
        label: 'Inference Failed',
        confidence: 0,
        classIndex: -1,
      },
      maturity: {
        label: 'Unknown',
        confidence: 0,
        classIndex: -1,
      },
      boxes: [],
      detection: {
        hasPineapple: false,
        predictions: 0,
        error: String(error),
      },
    };
  }
}

/**
 * Convert image URI to base64 string
 * Uses expo-file-system for reliable React Native file reading
 */
async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    console.log('🔷 Reading image file...', imageUri);
    
    // Use expo-file-system to read the file directly as base64
    let base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    
    // Remove data URL prefix if present (e.g. data:image/jpeg;base64,...)
    if (base64.includes(',')) {
      base64 = base64.split(',')[1];
      console.log('   Stripped data URL prefix');
    }
    
    // Trim whitespace/newlines
    base64 = base64.trim();
    
    if (!base64 || base64.length === 0) {
      console.error('❌ Base64 is empty after read');
      throw new Error('Empty file or failed to read');
    }
    
    // PNG signature in base64: iVBORw0KGgo
    if (base64.startsWith('iVBORw0KGgo')) {
      console.log('📸 Detected PNG, converting to JPEG...');
      const converted = await manipulateAsync(
        imageUri,
        [],
        { format: SaveFormat.JPEG, compress: 0.9, base64: true }
      );

      if (!converted.base64) {
        throw new Error('Failed to convert PNG to JPEG');
      }

      base64 = converted.base64;
      if (base64.includes(',')) {
        base64 = base64.split(',')[1];
      }
      base64 = base64.trim();
      console.log('✅ PNG converted to JPEG');
    }

    // Final validation: must be JPEG base64 (/9j)
    if (!base64.startsWith('/9j')) {
      console.error('❌ Not a valid JPEG base64. Starts with:', base64.substring(0, 20));
      throw new Error('Image is not JPEG and conversion failed');
    }
    
    console.log('✅ Valid JPEG base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('🔴 imageUriToBase64 failed:', error);
    throw error;
  }
}

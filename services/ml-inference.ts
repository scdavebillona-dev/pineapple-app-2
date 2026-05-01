/**
 * ML Inference Service
 * Variety, quality, and maturity: local ONNX models
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

type ModelSession = {
  session: ORT.InferenceSession;
  inputName: string;
  outputName: string;
  inputShape: number[];
  outputShape: number[];
};

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
}

export interface InferenceResult {
  variety: ModelOutput;
  quality: ModelOutput;
  maturity: ModelOutput;
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

interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array;
}

type LoadedModelState = {
  loaded: true;
  modelName: string;
  framework: string;
  mode: 'onnx';
  variety: ModelSession;
  queenQuality: ModelSession;
  smoothQuality: ModelSession;
  queenMaturity: ModelSession;
  smoothMaturity: ModelSession;
};

type ParseContext = {
  inputWidth: number;
  inputHeight: number;
};

const VARIETY_LABELS = ['Queen', 'Smooth Cayenne', 'No Pineapple'];
const QUALITY_LABELS = ['Class I', 'Class II', 'Extra Class'];
const MATURITY_LABELS = ['Overripe', 'Ripe', 'Unripe'];

const YOLO_CONF_THRESHOLD = 0.05;
const FAST_INFERENCE_MODE = false;

const VARIETY_MODEL_ASSET = require('../assets/model/variety.onnx');
const QUEEN_QUALITY_MODEL_ASSET = require('../assets/model/queen_quality.onnx');
const SMOOTH_QUALITY_MODEL_ASSET = require('../assets/model/smooth_quality.onnx');
const QUEEN_MATURITY_MODEL_ASSET = require('../assets/model/queen_maturity.onnx');
const SMOOTH_MATURITY_MODEL_ASSET = require('../assets/model/smooth_maturity.onnx');

let cachedVarietyModel: LoadedModelState | null = null;
let modelLoadPromise: Promise<LoadedModelState> | null = null;

function getOnnxRuntimeModule(): typeof import('onnxruntime-react-native') {
  try {
    const ortModule = require('onnxruntime-react-native') as typeof import('onnxruntime-react-native') | undefined;
    if (!ortModule) {
      throw new Error('onnxruntime-react-native resolved to an empty module');
    }
    return ortModule;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `ONNX Runtime native module is unavailable in this Android build. ` +
        `Rebuild the development app after installing/linking onnxruntime-react-native. Details: ${reason}`
    );
  }
}

function nowMs(): number {
  return Date.now();
}

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

async function loadOnnxSession(assetModule: number, modelName: string): Promise<ModelSession> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const modelUri = asset.localUri ?? asset.uri;
  if (!modelUri) {
    throw new Error(`Failed to resolve ONNX model asset URI for ${modelName}`);
  }

  const ortModule = getOnnxRuntimeModule();
  const InferenceSession = ortModule.InferenceSession ?? (ortModule as any).default?.InferenceSession;
  if (!InferenceSession) {
    throw new Error(
      'ONNX Runtime InferenceSession is unavailable. Rebuild the Android development app so the native ONNX module is included.'
    );
  }

  const session = await InferenceSession.create(modelUri);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  let inputShape = [1, 3, 640, 640];

  try {
    const inputMeta = (session as any).inputMetadata?.[inputName];
    if (inputMeta && Array.isArray(inputMeta.dimensions)) {
      const dims = inputMeta.dimensions.map((d: any) => (typeof d === 'number' && d > 0 ? d : -1));
      if (dims.length === 4) inputShape = dims;
    }
  } catch (error) {
    console.warn(`Could not read inputMetadata for ${modelName}`, error);
  }

  let outputShape: number[] = [];
  try {
    const outputMeta = (session as any).outputMetadata?.[outputName];
    if (outputMeta && Array.isArray(outputMeta.dimensions)) {
      outputShape = outputMeta.dimensions.map((d: any) => (typeof d === 'number' && d > 0 ? d : -1));
    }
  } catch (error) {
    console.warn(`Could not read outputMetadata for ${modelName}`, error);
  }

  return {
    session,
    inputName,
    outputName,
    inputShape,
    outputShape,
  };
}

export async function loadModel(): Promise<LoadedModelState> {
  if (cachedVarietyModel) return cachedVarietyModel;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      console.log('Loading local ONNX model bundle...');
      const startedAt = nowMs();

      if (Platform.OS === 'web') {
        throw new Error('ONNX Runtime is not supported on web in this app');
      }

      if (Constants.appOwnership === 'expo') {
        throw new Error('ONNX Runtime requires an Android development build, not Expo Go');
      }

      const [variety, queenQuality, smoothQuality, queenMaturity, smoothMaturity] = await Promise.all([
        loadOnnxSession(VARIETY_MODEL_ASSET, 'variety.onnx'),
        loadOnnxSession(QUEEN_QUALITY_MODEL_ASSET, 'queen_quality.onnx'),
        loadOnnxSession(SMOOTH_QUALITY_MODEL_ASSET, 'smooth_quality.onnx'),
        loadOnnxSession(QUEEN_MATURITY_MODEL_ASSET, 'queen_maturity.onnx'),
        loadOnnxSession(SMOOTH_MATURITY_MODEL_ASSET, 'smooth_maturity.onnx'),
      ]);

      const loadedState: LoadedModelState = {
        loaded: true,
        modelName: 'local ONNX bundle',
        framework: 'ONNX Runtime',
        mode: 'onnx',
        variety,
        queenQuality,
        smoothQuality,
        queenMaturity,
        smoothMaturity,
      };

      cachedVarietyModel = loadedState;
      console.log(`ONNX model bundle loaded in ${nowMs() - startedAt} ms`);
      return loadedState;
    } catch (error) {
      console.error('Failed to load local ONNX model bundle:', error);
      throw error;
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

async function runModelRaw(model: ModelSession, preprocessedFrame: PreprocessedFrame): Promise<Float32Array> {
  const ortModule = getOnnxRuntimeModule();
  const Tensor = ortModule.Tensor ?? (ortModule as any).default?.Tensor;
  if (!Tensor) {
    throw new Error(
      'ONNX Runtime Tensor is unavailable. Rebuild the Android development app so the native ONNX module is included.'
    );
  }

  const shape = preprocessedFrame.isChw
    ? [1, 3, preprocessedFrame.height, preprocessedFrame.width]
    : [1, preprocessedFrame.height, preprocessedFrame.width, 3];

  const inputTensor = new Tensor('float32', preprocessedFrame.tensor, shape);
  const outputs = await model.session.run({
    [model.inputName]: inputTensor,
  });

  const outputTensor = outputs[model.outputName] ?? Object.values(outputs)[0];
  if (!outputTensor) {
    throw new Error('No output from ONNX model');
  }

  return outputTensor.data instanceof Float32Array
    ? outputTensor.data
    : new Float32Array(outputTensor.data as ArrayLike<number>);
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
    const value = raw[i];
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
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

function sigmoid(value: number): number {
  if (value >= 0 && value <= 1) return value;
  return 1 / (1 + Math.exp(-value));
}

function argmax(values: ArrayLike<number>, limit: number): { index: number; score: number } {
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < limit; i++) {
    const score = values[i];
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { index: bestIndex, score: bestScore };
}

function tryExtractDetectionPrediction(
  raw: Float32Array,
  labels: string[],
  outputShape?: number[]
): ModelOutput | null {
  // Exported YOLO can be Nx6 with final class index.
  if (raw.length >= 6 && raw.length % 6 === 0) {
    const rows = raw.length / 6;
    let topClass = -1;
    let topConfidence = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < rows; i++) {
      const base = i * 6;
      const confidence = sigmoid(raw[base + 4]);
      const classIndex = Math.round(raw[base + 5]);
      if (classIndex < 0 || classIndex >= labels.length) continue;
      if (confidence > topConfidence) {
        topConfidence = confidence;
        topClass = classIndex;
      }
    }

    if (topClass >= 0) {
      return {
        label: labels[topClass],
        confidence: clamp01(topConfidence),
        classIndex: topClass,
      };
    }
  }

  if (!outputShape || outputShape.length !== 3 || outputShape[0] !== 1) {
    return null;
  }

  const channelLast = outputShape[2] === 5 + labels.length;
  const channelFirst = outputShape[1] === 5 + labels.length;
  if (!channelLast && !channelFirst) {
    return null;
  }

  const anchors = channelFirst ? outputShape[2] : outputShape[1];
  if (!Number.isFinite(anchors) || anchors <= 0) {
    return null;
  }

  let topClass = -1;
  let topConfidence = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < anchors; i++) {
    let obj = 0;
    if (channelFirst) {
      const stride = anchors;
      obj = sigmoid(raw[4 * stride + i]);
      for (let c = 0; c < labels.length; c++) {
        const cls = sigmoid(raw[(5 + c) * stride + i]);
        const score = obj * cls;
        if (score > topConfidence) {
          topConfidence = score;
          topClass = c;
        }
      }
    } else {
      const base = i * (5 + labels.length);
      obj = sigmoid(raw[base + 4]);
      for (let c = 0; c < labels.length; c++) {
        const cls = sigmoid(raw[base + 5 + c]);
        const score = obj * cls;
        if (score > topConfidence) {
          topConfidence = score;
          topClass = c;
        }
      }
    }
  }

  if (topClass >= 0) {
    return {
      label: labels[topClass],
      confidence: clamp01(topConfidence),
      classIndex: topClass,
    };
  }

  return null;
}

function reduceTensorToClassScores(
  raw: Float32Array,
  classCount: number,
  outputShape?: number[]
): Float32Array {
  if (raw.length === classCount) {
    return raw;
  }

  if (outputShape && outputShape.length > 0) {
    const shape = outputShape.filter((d) => Number.isFinite(d) && d > 0);
    const volume = shape.reduce((acc, dim) => acc * dim, 1);
    if (shape.length > 0 && volume === raw.length) {
      const classDim = shape.findIndex((dim) => dim === classCount);
      if (classDim >= 0) {
        const strides = new Array(shape.length).fill(1);
        for (let i = shape.length - 2; i >= 0; i--) {
          strides[i] = strides[i + 1] * shape[i + 1];
        }

        const scores = new Float32Array(classCount);
        const counts = new Uint32Array(classCount);
        const classStride = strides[classDim];

        for (let index = 0; index < raw.length; index++) {
          const classIndex = Math.floor(index / classStride) % classCount;
          scores[classIndex] += raw[index];
          counts[classIndex] += 1;
        }

        for (let c = 0; c < classCount; c++) {
          if (counts[c] > 0) {
            scores[c] = scores[c] / counts[c];
          }
        }
        return scores;
      }
    }
  }

  const fallback = new Float32Array(classCount);
  const step = Math.max(1, Math.floor(raw.length / classCount));
  for (let c = 0; c < classCount; c++) {
    const start = c * step;
    const end = Math.min(raw.length, c === classCount - 1 ? raw.length : start + step);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += raw[i];
    }
    fallback[c] = end > start ? sum / (end - start) : 0;
  }
  return fallback;
}

function extractClassificationPrediction(
  raw: Float32Array,
  labels: string[],
  outputShape?: number[]
): ModelOutput {
  const detectionPrediction = tryExtractDetectionPrediction(raw, labels, outputShape);
  if (detectionPrediction) {
    return detectionPrediction;
  }

  const classScores = reduceTensorToClassScores(raw, labels.length, outputShape);
  const probabilities = normalizeScores(classScores);
  const limit = Math.min(probabilities.length, labels.length);
  const { index: bestIndex, score: bestScore } = argmax(probabilities, limit);

  if (bestIndex >= 0) {
    return {
      label: labels[bestIndex],
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

  if (shape.length === 3 && shape[2] === 6) return parseDetectionsNx6(raw, ctx);
  if (shape.length === 2 && shape[1] === 6) return parseDetectionsNx6(raw, ctx);
  if (shape.length === 1 && raw.length % 6 === 0) return parseDetectionsNx6(raw, ctx);

  if (shape.length === 3 && shape[1] === 84 && Number.isFinite(shape[2])) return parseDetections1x84xN(raw, shape[2], ctx);
  if (shape.length === 3 && shape[2] === 84 && Number.isFinite(shape[1])) return parseDetections1xNx84(raw, shape[1], ctx);

  if (raw.length % 6 === 0) return parseDetectionsNx6(raw, ctx);
  if (raw.length % 84 === 0) return parseDetections1xNx84(raw, raw.length / 84, ctx);

  return [];
}

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

async function decodeSourceImage(imageUri: string): Promise<DecodedImage> {
  let base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

  if (base64.includes(',')) {
    base64 = base64.split(',')[1];
  }
  base64 = base64.trim();

  if (!base64 || base64.length < 100) {
    throw new Error(`Invalid base64: length ${base64.length}`);
  }

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
    throw new Error(`Invalid JPEG base64. Starts with: ${base64.substring(0, 20)}`);
  }

  const imageBytes = toByteArray(base64);
  if (imageBytes.length < 10) {
    throw new Error(`Invalid image bytes: length ${imageBytes.length}`);
  }

  const byte0Hex = imageBytes[0].toString(16).padStart(2, '0');
  const byte1Hex = imageBytes[1].toString(16).padStart(2, '0');
  if (imageBytes[0] !== 0xFF || imageBytes[1] !== 0xD8) {
    throw new Error(`Invalid JPEG: SOI marker not found at offset 0. Got 0x${byte0Hex}${byte1Hex}`);
  }

  const decoded = jpeg.decode(imageBytes, { useTArray: true, maxResolutionInMP: 100 });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
  };
}

function buildPreprocessedFrame(decoded: DecodedImage, inputShape: number[]): PreprocessedFrame {
  const isChw = inputShape.length === 4 && inputShape[1] === 3;
  const targetWidth = inputShape.length >= 4 && Number.isFinite(inputShape[3]) ? (inputShape[3] as number) : 640;
  const targetHeight = inputShape.length >= 4 && Number.isFinite(inputShape[2]) ? (inputShape[2] as number) : 640;

  const tensor = new Float32Array(3 * targetWidth * targetHeight);
  const hw = targetWidth * targetHeight;
  const scaleX = decoded.width / targetWidth;
  const scaleY = decoded.height / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    const srcY = (y + 0.5) * scaleY - 0.5;
    const y1 = Math.max(0, Math.floor(srcY));
    const y2 = Math.min(y1 + 1, decoded.height - 1);
    const wy = srcY - y1;

    for (let x = 0; x < targetWidth; x++) {
      const srcX = (x + 0.5) * scaleX - 0.5;
      const x1 = Math.max(0, Math.floor(srcX));
      const x2 = Math.min(x1 + 1, decoded.width - 1);
      const wx = srcX - x1;

      const p11 = (y1 * decoded.width + x1) * 4;
      const p12 = (y1 * decoded.width + x2) * 4;
      const p21 = (y2 * decoded.width + x1) * 4;
      const p22 = (y2 * decoded.width + x2) * 4;

      for (let c = 0; c < 3; c++) {
        const v11 = decoded.data[p11 + c];
        const v12 = decoded.data[p12 + c];
        const v21 = decoded.data[p21 + c];
        const v22 = decoded.data[p22 + c];

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

  return {
    tensor,
    width: targetWidth,
    height: targetHeight,
    isChw,
  };
}

export async function preprocessFrame(imageUri: string, inputShape: number[]): Promise<PreprocessedFrame> {
  const decoded = await decodeSourceImage(imageUri);
  return buildPreprocessedFrame(decoded, inputShape);
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
  const preprocessed = await preprocessFrame(imageUri, model.variety.inputShape);
  const raw = await runModelRaw(model.variety, preprocessed);

  console.log('[DEBUG] ONNX shape from metadata:', model.variety.outputShape);
  console.log('[DEBUG] First 20 raw outputs:', Array.from(raw.slice(0, 20)).map((value) => value.toFixed(4)).join(', '));

  const localResult = extractVarietyPrediction(raw);
  const normalized = normalizeVarietyClassName(localResult.label);

  console.log(`Variety ONNX inference took ${nowMs() - startedAt} ms`);

  return {
    ...localResult,
    label: normalized,
    classIndex: VARIETY_LABELS.indexOf(normalized),
  };
}

export async function runInference(
  model: LoadedModelState,
  preprocessedFrame: PreprocessedFrame
): Promise<ModelOutput> {
  const raw = await runModelRaw(model.variety, preprocessedFrame);
  return extractVarietyPrediction(raw);
}

export async function performVarietyOnlyInference(
  imageUri: string,
  model: any
): Promise<VarietyOnlyInferenceResult> {
  try {
    console.log('🔷 [Inference] Starting variety analysis...');
    const varietyModel: LoadedModelState | null = model?.loaded ? model : cachedVarietyModel;
    if (!varietyModel) {
      throw new Error('Variety ONNX model not loaded');
    }

    console.log('🔷 [Inference] Preprocessing image...');
    const preprocessed = await preprocessFrame(imageUri, varietyModel.variety.inputShape);

    console.log('🔷 [Inference] Running ONNX inference...');
    const raw = await runModelRaw(varietyModel.variety, preprocessed);
    console.log('🔷 [Inference] Output shape from metadata:', varietyModel.variety.outputShape);
    console.log('🔷 [Inference] Model output length:', raw.length);

    const parsedBoxes = parseYoloBoxes(raw, varietyModel.variety.outputShape, {
      inputWidth: preprocessed.width,
      inputHeight: preprocessed.height,
    });
    console.log('🔷 [Inference] Detected', parsedBoxes.length, 'boxes');

    const varietyResult = parsedBoxes.length > 0
      ? (() => {
          const top = [...parsedBoxes].sort((a, b) => b.confidence - a.confidence)[0];
          return {
            label: top.label,
            confidence: top.confidence,
            classIndex: top.classIndex,
          };
        })()
      : {
          label: 'No Pineapple',
          confidence: 0,
          classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
        };

    const detection = parsedBoxes.length > 0
      ? { hasPineapple: true, predictions: parsedBoxes.length }
      : { hasPineapple: false, predictions: 0 };

    if (parsedBoxes.length > 0) {
      console.log('✅ [Inference] Detected:', varietyResult.label, `(${(varietyResult.confidence * 100).toFixed(1)}%)`);
    } else {
      console.log('⚠️  [Inference] No pineapple found in image');
    }

    return {
      variety: varietyResult,
      detection,
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
    };
  }
}

export async function performInference(
  imageUri: string,
  model: any
): Promise<InferenceResult> {
  const pipelineStartedAt = nowMs();
  try {
    console.log('🟢 UPLOAD ANALYSIS STARTED');
    const varietyModel: LoadedModelState | null = model?.loaded ? model : cachedVarietyModel;
    if (!varietyModel) {
      throw new Error('Variety ONNX model not loaded');
    }

    const sourceImage = await decodeSourceImage(imageUri);
    const varietyFrame = buildPreprocessedFrame(sourceImage, varietyModel.variety.inputShape);
    const queenQualityFrame = buildPreprocessedFrame(sourceImage, varietyModel.queenQuality.inputShape);
    const smoothQualityFrame = buildPreprocessedFrame(sourceImage, varietyModel.smoothQuality.inputShape);
    const queenMaturityFrame = buildPreprocessedFrame(sourceImage, varietyModel.queenMaturity.inputShape);
    const smoothMaturityFrame = buildPreprocessedFrame(sourceImage, varietyModel.smoothMaturity.inputShape);

    const [varietyRaw, queenQualityRaw, smoothQualityRaw, queenMaturityRaw, smoothMaturityRaw] = await Promise.all([
      runModelRaw(varietyModel.variety, varietyFrame),
      runModelRaw(varietyModel.queenQuality, queenQualityFrame),
      runModelRaw(varietyModel.smoothQuality, smoothQualityFrame),
      runModelRaw(varietyModel.queenMaturity, queenMaturityFrame),
      runModelRaw(varietyModel.smoothMaturity, smoothMaturityFrame),
    ]);

    console.log('🔷 [Inference] Output shape from metadata:', varietyModel.variety.outputShape);
    console.log('🔷 [Inference] Model output length:', varietyRaw.length);

    const parsedBoxes = parseYoloBoxes(varietyRaw, varietyModel.variety.outputShape, {
      inputWidth: varietyFrame.width,
      inputHeight: varietyFrame.height,
    });
    console.log('🔷 [Inference] Detected', parsedBoxes.length, 'boxes');

    const varietyResult = parsedBoxes.length > 0
      ? (() => {
          const top = [...parsedBoxes].sort((a, b) => b.confidence - a.confidence)[0];
          return {
            label: top.label,
            confidence: top.confidence,
            classIndex: top.classIndex,
          };
        })()
      : {
          label: 'No Pineapple',
          confidence: 0,
          classIndex: VARIETY_LABELS.indexOf('No Pineapple'),
        };

    const detectionResult = parsedBoxes.length > 0
      ? { hasPineapple: true, predictions: parsedBoxes.length }
      : { hasPineapple: false, predictions: 0 };

    const queenQualityResult = extractClassificationPrediction(
      queenQualityRaw,
      QUALITY_LABELS,
      varietyModel.queenQuality.outputShape
    );
    const smoothQualityResult = extractClassificationPrediction(
      smoothQualityRaw,
      QUALITY_LABELS,
      varietyModel.smoothQuality.outputShape
    );
    const queenMaturityResult = extractClassificationPrediction(
      queenMaturityRaw,
      MATURITY_LABELS,
      varietyModel.queenMaturity.outputShape
    );
    const smoothMaturityResult = extractClassificationPrediction(
      smoothMaturityRaw,
      MATURITY_LABELS,
      varietyModel.smoothMaturity.outputShape
    );

    console.log('🔷 [Inference] All ONNX model outputs:', {
      variety: {
        label: varietyResult.label,
        confidence: varietyResult.confidence,
        classIndex: varietyResult.classIndex,
        outputShape: varietyModel.variety.outputShape,
        rawLength: varietyRaw.length,
      },
      queenQuality: {
        label: queenQualityResult.label,
        confidence: queenQualityResult.confidence,
        classIndex: queenQualityResult.classIndex,
        outputShape: varietyModel.queenQuality.outputShape,
        rawLength: queenQualityRaw.length,
      },
      smoothQuality: {
        label: smoothQualityResult.label,
        confidence: smoothQualityResult.confidence,
        classIndex: smoothQualityResult.classIndex,
        outputShape: varietyModel.smoothQuality.outputShape,
        rawLength: smoothQualityRaw.length,
      },
      queenMaturity: {
        label: queenMaturityResult.label,
        confidence: queenMaturityResult.confidence,
        classIndex: queenMaturityResult.classIndex,
        outputShape: varietyModel.queenMaturity.outputShape,
        rawLength: queenMaturityRaw.length,
      },
      smoothMaturity: {
        label: smoothMaturityResult.label,
        confidence: smoothMaturityResult.confidence,
        classIndex: smoothMaturityResult.classIndex,
        outputShape: varietyModel.smoothMaturity.outputShape,
        rawLength: smoothMaturityRaw.length,
      },
    });

    if (!detectionResult.hasPineapple) {
      console.log('🟠 No pineapple detected');
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
        detection: detectionResult,
      };
    }

    const pineappleFamily = varietyResult.label.toLowerCase().includes('smooth') ? 'smooth' : 'queen';
    const qualityResult = pineappleFamily === 'smooth' ? smoothQualityResult : queenQualityResult;
    const maturityResult = pineappleFamily === 'smooth' ? smoothMaturityResult : queenMaturityResult;
    console.log(
      `🔷 [Inference] Variety routing: ${varietyResult.label} -> using ${pineappleFamily}_quality.onnx and ${pineappleFamily}_maturity.onnx`
    );

    const totalTime = nowMs() - pipelineStartedAt;
    console.log(`✅ ANALYSIS COMPLETE (${totalTime}ms) - ${varietyResult.label}, Quality: ${qualityResult.label}, Maturity: ${maturityResult.label}`);

    return {
      variety: varietyResult,
      quality: qualityResult,
      maturity: maturityResult,
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
      detection: {
        hasPineapple: false,
        predictions: 0,
        error: String(error),
      },
    };
  }
}

async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    console.log('🔷 Reading image file...', imageUri);

    let base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    if (base64.includes(',')) {
      base64 = base64.split(',')[1];
      console.log('   Stripped data URL prefix');
    }

    base64 = base64.trim();

    if (!base64 || base64.length === 0) {
      throw new Error('Empty file or failed to read');
    }

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

    if (!base64.startsWith('/9j')) {
      throw new Error(`Image is not JPEG and conversion failed. Starts with: ${base64.substring(0, 20)}`);
    }

    console.log('✅ Valid JPEG base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('🔴 imageUriToBase64 failed:', error);
    throw error;
  }
}

# Real-Time Queen Maturity Scanner - ONNX Integration Guide

## Overview
The camera screen has been configured with:
- ✅ Real-time camera preview using `expo-camera`
- ✅ Frame capture and processing pipeline
- ✅ Results display with confidence scores
- ⏳ ONNX model inference (ready for setup)

## Current Status
The UI is fully functional with **mock ML output** for development/testing.

## ONNX Integration Steps

### Step 1: Install ONNX Runtime
Choose one option based on your needs:

**Option A: React Native ONNX Runtime (Best for production)**
```bash
npm install react-native-onnxruntime
cd ios && pod install && cd ..
```

**Option B: TensorFlow Lite (if ONNX not available)**
```bash
# First, convert ONNX to TFLite format using official converter
# Then install:
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install react-native-jpeg
```

### Step 2: Copy Model Files
Your model files are already in place:
```
assets/model/queen_maturity.onnx
assets/model/queen_maturity.onnx.data
```

### Step 3: Update ML Inference Service
Edit `services/ml-inference.ts` and implement:

1. **loadModel()** - Load ONNX model
```typescript
import * as onnxruntime from 'react-native-onnxruntime';

export async function loadModel() {
  const modelPath = require('@/assets/model/queen_maturity.onnx');
  const session = await onnxruntime.InferenceSession.create(modelPath);
  return session;
}
```

2. **preprocessFrame()** - Convert camera frame to tensor
```typescript
// Resize image to 224x224
// Normalize pixel values: (value - 127.5) / 127.5
// Convert to tensor format expected by model
```

3. **runInference()** - Execute inference
```typescript
export async function runInference(model, tensor) {
  const feeds = { 'images': tensor };
  const output = await model.run(feeds);
  return output;
}
```

4. **postprocessOutput()** - Parse results
```typescript
// Parse model output to get confidence and label
// Adjust based on your model's actual output format
```

### Step 4: Update Camera Screen
In `app/(app)/camera.tsx`, replace mock inference with real:

```typescript
// Replace this:
const mockResult: ScanResult = { ... };

// With this:
const result = await performInference(photo, model);
const scanResult: ScanResult = {
  confidence: result.confidence,
  label: result.label,
  timestamp: new Date().toLocaleTimeString(),
};
```

## Model Specifications
You need to find/verify your model's:
- **Input shape**: Expected image dimensions (usually 224x224 or 416x416)
- **Input format**: RGB or BGR, normalized or raw
- **Output structure**: Class names and confidence format
- **Input name**: e.g., "images", "input", "input_1"
- **Output name**: e.g., "output", "probabilities"

## Performance Considerations
- Frame capture every 500-1000ms to avoid performance issues
- Consider using `skipProcessing: true` for faster capture
- Implement frame skipping if model inference is slow
- Cache the loaded model instance

## Troubleshooting
1. **Model not loading**: Check file paths and ONNX Runtime installation
2. **Memory issues**: Implement frame buffer limits
3. **Slow inference**: Reduce input image size or use model quantization
4. **Permission errors**: Ensure camera permissions are granted

## Files Modified
- `app/(app)/camera.tsx` - Real-time scanning UI
- `services/ml-inference.ts` - ML inference service (awaiting implementation)

## Next Steps
1. Install ONNX Runtime package
2. Implement `loadModel()` in ml-inference.ts
3. Test with a static image first
4. Integrate into real-time camera loop
5. Fine-tune performance and accuracy

## Model Testing
To test the model works:
```typescript
// Test with a single image first
import { loadModel, performInference } from '@/services/ml-inference';

const model = await loadModel();
const result = await performInference(testImageBase64, model);
console.log('Result:', result);
```

Good luck! 🎯

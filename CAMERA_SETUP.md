# Real-Time Camera & Image Upload Setup Guide

## Current Status
✅ **Real-Time Scanning** - Working (mock ML predictions)  
⏳ **Capture Mode** - Ready for setup  
⏳ **Upload Mode** - Ready for setup

## Three Camera Modes

### 1. Real-Time Mode (Live Scanning)
- Generates mock ML predictions every 1.5 seconds
- Shows confidence score and detection label
- Displays history of scans

### 2. Capture Mode (Camera Photo)
- Requires `expo-camera` package
- Captures single photo from device camera
- Analyzes with your ML model
- Ready to test with real images

### 3. Upload Mode (Gallery)
- Requires `expo-image-picker` package
- Select images from device gallery
- Analyzes with your ML model
- Perfect for testing with your bee queen images

## Installation Steps

### Step 1: Install Required Packages
```bash
# Install both camera and image picker
npm install expo-camera expo-image-picker

# If using Expo, run:
expo install expo-camera expo-image-picker
```

### Step 2: Update camera.tsx Imports
Uncomment the imports at the top of `app/(app)/camera.tsx`:

```tsx
// At the top of the file, uncomment:
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
```

### Step 3: Enable Photo Functions
In the `CameraScreen` component, replace the placeholder functions:

**For Capture Mode:**
```tsx
const capturePhoto = async () => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setCapturedImage(imageUri);
      await analyzeImage(imageUri, 'Captured Image');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to capture image');
  }
};
```

**For Upload Mode:**
```tsx
const pickImageFromGallery = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setCapturedImage(imageUri);
      await analyzeImage(imageUri, 'Uploaded Image');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image');
  }
};
```

### Step 4: Implement ML Inference
In the `analyzeImage` function, replace the mock predictions with real ONNX model inference:

```tsx
const analyzeImage = async (imageUri: string, label: string) => {
  setIsProcessing(true);
  try {
    // Load image and convert to tensor
    const imageData = await loadImageAsBase64(imageUri);
    
    // Load your ONNX model
    const model = await loadModel();
    
    // Run inference
    const result = await performInference(imageData, model);
    
    // Add to results
    setScanResults(prev => [{
      confidence: result.confidence,
      label: result.label,
      timestamp: new Date().toLocaleTimeString(),
      image: imageUri,
    }, ...prev].slice(0, 20));
    
    Alert.alert('Analysis Complete', 
      `Confidence: ${(result.confidence * 100).toFixed(1)}%\nLabel: ${result.label}`);
  } catch (error) {
    Alert.alert('Error', 'Failed to analyze image');
  } finally {
    setIsProcessing(false);
  }
};
```

## Usage Flow

1. **Start with Real-Time Mode**
   - Test that everything loads properly
   - See mock ML predictions working

2. **Switch to Capture Mode**
   - Take photos of bee queens
   - Test your ML model with fresh camera images

3. **Use Upload Mode for Testing**
   - Add your queen bee images to device gallery
   - Test recognition accuracy
   - Iterate on model performance

## Testing Your ML Model

### Quick Test:
1. Go to Camera section
2. Switch to "Capture" tab
3. Tap "Take Photo"
4. Get real prediction from your ONNX model

### Batch Testing:
1. Switch to "Upload" tab
2. Test multiple images from gallery
3. Review confidence scores
4. Check detection accuracy

## Troubleshooting

**Q: "Camera not working"**  
A: Make sure you've installed `expo-camera` and have camera permissions granted in your device settings.

**Q: "Image picker not showing"**  
A: Install `expo-image-picker` and request gallery permissions on first launch.

**Q: "ML predictions not working"**  
A: Implement the `performInference` function from `services/ml-inference.ts` in the `analyzeImage` function.

**Q: "Performance Issues"**  
A: For large images, resize them before inference:
```tsx
// Resize image to 224x224 for model input
const resizedImage = await resizeImage(imageUri, 224, 224);
```

## Files to Update

1. **app/(app)/camera.tsx**
   - Uncomment ImagePicker/CameraView imports
   - Replace `capturePhoto()` with real implementation
   - Replace `pickImageFromGallery()` with real implementation
   - Integrate ML inference in `analyzeImage()`

2. **services/ml-inference.ts**
   - Implement `loadModel()`
   - Implement `preprocessFrame()`
   - Implement `runInference()`
   - Implement `postprocessOutput()`

3. **package.json**
   - Add `"expo-camera"` dependency
   - Add `"expo-image-picker"` dependency

## Next Steps

1. Install the packages
2. Uncomment imports in camera.tsx
3. Implement real image capture/upload
4. Integrate your ONNX model inference
5. Test with real bee queen images
6. Optimize model performance based on results

Good luck testing your ML model! 🐝

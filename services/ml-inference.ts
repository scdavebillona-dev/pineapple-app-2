/**
 * ML Inference Service for Pineapple Variety Detection
 * Calls Roboflow API directly (no Flask backend needed)
 * 
 * STATUS: Direct API integration for Android/iOS
 * 
 * Model: pineapple-variety-honut/4 (Roboflow)
 * Classes: Queen, Smooth Cayenne
 */

interface ModelOutput {
  label: string;
  confidence: number;
  classIndex: number;
}

/**
 * Combined inference output with variety, quality, maturity, and detection
 */
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
}

// Pineapple variety class labels
const VARIETY_LABELS = [
  'Queen',
  'Smooth',
];

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
  if (lowerClass.includes('queen')) return 'Queen';
  if (lowerClass.includes('cayenne') || lowerClass.includes('cayene') || lowerClass.includes('smooth')) return 'Smooth';
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
const DETECTION_MODEL_ID = 'pineapple-detection-ygkhd/3';
const VARIETY_API_URL = `https://detect.roboflow.com/${VARIETY_MODEL_ID}`;
const QUALITY_API_URL = `https://detect.roboflow.com/${QUALITY_MODEL_ID}`;
const MATURITY_API_URL = `https://classify.roboflow.com/${MATURITY_MODEL_ID}`;
const DETECTION_API_URL = `https://detect.roboflow.com/${DETECTION_MODEL_ID}`;

let modelLoaded = false;

/**
 * Load the model - Initialize Roboflow API
 */
export async function loadModel() {
  try {
    console.log('🔌 Initializing Roboflow API...');
    
    // Just mark as loaded - actual connectivity tested on first inference
    modelLoaded = true;
    
    console.log('✅ Roboflow API Ready');
    console.log('📁 API: detect.roboflow.com');
    console.log('🍍 Variety Classes: Queen, Smooth Cayenne');
    console.log('📊 Quality Classes: Class I, Class II, Extra Class, Reject');
    console.log('🤖 Variety Model: pineapple-variety-honut/4');
    console.log('🤖 Quality Model: pineapple_quality/2');
    console.log('🌿 Maturity Classes: Unripe, Underripe, Ripe, Overripe');
    console.log('🤖 Maturity Model: maturity-kahvp/2');
    
    return { 
      loaded: true, 
      modelName: 'Roboflow API (Triple Models)',
      framework: 'Roboflow Cloud'
    };
  } catch (error) {
    console.error('❌ Error initializing API:', error);
    modelLoaded = false;
    throw error;
  }
}

/**
 * Preprocess image - Not used with API
 * Kept for compatibility but not called in API mode
 */
export async function preprocessFrame(
  imageUri: string,
  targetWidth: number = 224,
  targetHeight: number = 224
): Promise<PreprocessedFrame> {
  const tensorSize = 3 * targetWidth * targetHeight;
  const tensor = new Float32Array(tensorSize);
  for (let i = 0; i < tensorSize; i++) {
    tensor[i] = Math.random();
  }
  return {
    tensor,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Run inference - Handled by performInference() which calls Flask API
 * This function is kept for compatibility but not actively used
 */
export async function runInference(
  model: any,
  preprocessedFrame: PreprocessedFrame
): Promise<ModelOutput> {
  // API inference is handled in performInference()
  throw new Error('Use performInference() instead for API-based inference');
}

/**
 * Post-process Roboflow API response for variety
 */
function postprocessVarietyOutput(apiResponse: any): ModelOutput {
  try {
    if (!apiResponse) {
      throw new Error('No API response');
    }

    const predictions = apiResponse.predictions || [];
    let topPrediction = 'Unknown';
    let topConfidence = 0;
    
    if (predictions.length > 0) {
      for (const pred of predictions) {
        const confidence = pred.confidence || 0;
        const className = normalizeVarietyClassName(pred.class || 'Unknown');
        
        if (confidence > topConfidence) {
          topConfidence = confidence;
          topPrediction = className;
        }
      }
    }

    console.log(`✅ Variety: ${topPrediction} (${(topConfidence * 100).toFixed(1)}%)`);

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: VARIETY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('❌ Variety post-processing error:', error);
    return {
      label: 'Error',
      confidence: 0,
      classIndex: -1,
    };
  }
}

/**
 * Post-process Roboflow API response for quality
 */
function postprocessQualityOutput(apiResponse: any): ModelOutput {
  try {
    if (!apiResponse) {
      throw new Error('No API response');
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

    console.log(`✅ Quality: ${topPrediction} (${(topConfidence * 100).toFixed(1)}%)`);

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: QUALITY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('❌ Quality post-processing error:', error);
    return {
      label: 'Error',
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
      throw new Error('No API response');
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
        // predictions can also be an object keyed by class name
        for (const [cls, val] of Object.entries(predictions)) {
          const c = (val as any).confidence ?? (typeof val === 'number' ? val : 0);
          if (c > topConfidence) {
            topConfidence = c;
            topPrediction = normalizeMaturityClassName(cls);
          }
        }
      }
    }

    console.log(`✅ Maturity: ${topPrediction} (${(topConfidence * 100).toFixed(1)}%)`);

    return {
      label: topPrediction,
      confidence: Math.min(Math.max(topConfidence, 0), 1),
      classIndex: MATURITY_LABELS.indexOf(topPrediction),
    };
  } catch (error) {
    console.error('❌ Maturity post-processing error:', error);
    return {
      label: 'Unknown',
      confidence: 0,
      classIndex: -1,
    };
  }
}

/**
 * Post-process Roboflow API response for detection
 * Returns whether pineapple was detected
 */
function postprocessDetectionOutput(apiResponse: any): { hasPineapple: boolean; predictions: number; error?: string } {
  try {
    if (!apiResponse) {
      return { hasPineapple: false, predictions: 0, error: 'No API response' };
    }

    const predictions = apiResponse.predictions || [];
    
    // Filter predictions: only count valid pineapple detections with confidence > 0.5
    const validPineapplePredictions = predictions.filter((pred: any) => {
      const confidence = pred.confidence || 0;
      const className = (pred.class || '').toLowerCase().trim();
      
      // Check if it's a pineapple prediction with sufficient confidence
      return (className.includes('pineapple') || className === 'pineapple') && confidence > 0.5;
    });

    const predictionCount = validPineapplePredictions.length;
    
    if (predictionCount === 0) {
      console.log('⚠️  No pineapple detected in image (confidence > 0.5)');
      console.log(`   Total predictions: ${predictions.length}, Valid pineapple: ${predictionCount}`);
      return { hasPineapple: false, predictions: 0 };
    }

    const topConfidence = Math.max(...validPineapplePredictions.map((p: any) => p.confidence || 0));
    console.log(`✅ Detection: Pineapple detected (${predictionCount} valid prediction${predictionCount > 1 ? 's' : ''}, top confidence: ${(topConfidence * 100).toFixed(1)}%)`);
    return { hasPineapple: true, predictions: predictionCount };
  } catch (error) {
    console.error('❌ Detection post-processing error:', error);
    return { hasPineapple: false, predictions: 0, error: String(error) };
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
    console.log(`✅ ${modelName} Response received`);
    return apiResponse;
  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error);
    throw error;
  }
}

/**
 * Complete inference pipeline: Call variety, quality, and detection APIs in parallel
 */
export async function performInference(
  imageUri: string,
  model: any
): Promise<InferenceResult> {
  try {
    console.log('📸 Starting triple inference with image:', imageUri);
    
    // Convert image to base64 once
    const base64 = await imageUriToBase64(imageUri);
    console.log('✅ Image converted to base64');
    
    // Call all four APIs in parallel
    console.log('🚀 Calling all four models in parallel...');
    const [varietyResponse, qualityResponse, maturityResponse, detectionResponse] = await Promise.all([
      callRoboflowAPI(base64, VARIETY_API_URL, 'Variety Model').catch(err => {
        console.error('Variety API failed:', err);
        return null;
      }),
      callRoboflowAPI(base64, QUALITY_API_URL, 'Quality Model').catch(err => {
        console.error('Quality API failed:', err);
        return null;
      }),
      callRoboflowAPI(base64, MATURITY_API_URL, 'Maturity Model').catch(err => {
        console.error('Maturity API failed:', err);
        return null;
      }),
      callRoboflowAPI(base64, DETECTION_API_URL, 'Detection Model').catch(err => {
        console.error('Detection API failed:', err);
        return null;
      }),
    ]);
    
    // Check detection first - if no pineapple, return early
    const detectionResult = postprocessDetectionOutput(detectionResponse);
    
    // Process other responses
    const varietyResult = postprocessVarietyOutput(varietyResponse);
    const qualityResult = postprocessQualityOutput(qualityResponse);
    const maturityResult = postprocessMaturityOutput(maturityResponse);
    
    console.log(`✅ Final Results:`);
    console.log(`  🍍 Variety: ${varietyResult.label} (${(varietyResult.confidence * 100).toFixed(1)}%)`);
    console.log(`  📊 Quality: ${qualityResult.label} (${(qualityResult.confidence * 100).toFixed(1)}%)`);
    console.log(`  🌿 Maturity: ${maturityResult.label} (${(maturityResult.confidence * 100).toFixed(1)}%)`);
    console.log(`  🔍 Detection: ${detectionResult.hasPineapple ? 'Pineapple Detected' : 'No Pineapple Detected'}`);
    
    return {
      variety: varietyResult,
      quality: qualityResult,
      maturity: maturityResult,
      detection: detectionResult,
    };
  } catch (error) {
    console.error('❌ Error in inference pipeline:', error);
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

/**
 * Convert image URI to base64 string
 * Works with React Native file URIs
 */
async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    // For React Native, read the file directly
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

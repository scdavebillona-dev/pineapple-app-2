const fs = require('fs');
const code = fs.readFileSync('app/(app)/camera.tsx', 'utf8');

const newAnalyze = \  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      if (!modelLoaded || !model) {
        Alert.alert('API Not Ready', 'Waiting for Roboflow API connection.');
        return;
      }

      const inferenceResult = await InferenceService.performInference(capturedImage, model);

      if (!inferenceResult.detection.hasPineapple) {
        Alert.alert('No Pineapple', 'No pineapple detected in image. Please try another.');
        return;
      }

      const formattedDate = new Date().toISOString();
      const result: ScanResult = {
        confidence: inferenceResult.variety.confidence,
        label: inferenceResult.variety.label,
        timestamp: formattedDate,
        image: capturedImage,
        quality: inferenceResult.quality.label?.replace(/High Quality/i, 'Extra Class') || 'Extra Class',
        qualityConfidence: inferenceResult.quality.confidence,
      };

      setCurrentResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveScan = async () => {
    if (currentResult) {
      try {
        const newScan = {
          id: Math.random().toString(),
          variety: currentResult.label,
          confidence: currentResult.confidence,
          uri: currentResult.image,
          timestamp: currentResult.timestamp,
          quality: currentResult.quality?.replace(/High Quality/i, 'Extra Class') || 'Extra Class',
          metadata: {
            qualityConfidence: currentResult.qualityConfidence
          }
        };
        await StorageService.saveScan(newScan);
        setCurrentResult(null);
        setCapturedImage(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to save scan');
      }
    }
  };\;

let newCode = code.replace(/const analyzeImage = async \(\) => \{[\s\S]*?Alert\.alert\('Error', 'Failed to save scan'\);\s*\}\s*\}\s*};/m, newAnalyze);

fs.writeFileSync('app/(app)/camera.tsx', newCode);

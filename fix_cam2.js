const fs = require('fs');
let code = fs.readFileSync('app/(app)/camera.tsx', 'utf8');

const newReturn = \  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Card style={styles.topActionsCard}>
          <View style={styles.captureUploadActions}>
            <Button
              title="Capture"
              onPress={handleCapture}
              icon="camera-alt"
              style={styles.actionButton}
            />
            <Button
              title="Upload"
              variant="outline"
              onPress={handleUpload}
              icon="photo-library"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Content Area */}
        {capturedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <View style={styles.imageActions}>
              {!currentResult && (
                <Button
                  title={isProcessing ? 'Analyzing...' : 'Analyze Image'}
                  onPress={analyzeImage}
                  disabled={isProcessing}
                  loading={isProcessing}
                  icon="analytics"
                  style={styles.actionButton}
                />
              )}
              <Button
                title="Clear"
                variant="outline"
                onPress={clearImage}
                disabled={isProcessing}
                icon="delete-outline"
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : (
          <Card style={styles.placeholderCard}>
            <EmptyState
              icon="image-search"
              title="Select Image"
              description="Use the buttons above to capture or select a pineapple."
            />
          </Card>
        )}\;

code = code.replace(/  return \([\s\S]*?<\/Card>\s*\)\}/, newReturn);
fs.writeFileSync('app/(app)/camera.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('components/ui/item-card.tsx', 'utf8');

const newBadge = \          <View style={styles.badges}>
            <TouchableOpacity onPress={() => {
              const varConf = (item.confidence * 100).toFixed(1) + '%';
              const clsConf = item.qualityConfidence 
                ? (item.qualityConfidence * 100).toFixed(1) + '%' 
                : 'N/A';
              Alert.alert('Confidence Levels', \\\Variety Confidence: \\\\\nClass Confidence: \\\\);
            }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.eyeIconBtn}>
              <MaterialIcons name="visibility" size={20} color={Colors.primary} />
            </TouchableOpacity>
            {item.quality && (
              <QualityBadge quality={item.quality} size="sm" style={styles.qualityBadge} />
            )}\;

code = code.replace(/<View style=\{styles.badges\}>\s*<ConfidenceBadge confidence=\{item.confidence\} size="sm" \/>\s*\{item.quality && \(\s*<QualityBadge quality=\{item.quality\} size="sm" style=\{styles.qualityBadge\} \/>\s*\)\}/m, newBadge);

// also replace for grid overlay
const newGridBadge = \        <View style={styles.gridBadgeOverlay}>
          <TouchableOpacity onPress={() => {
            const varConf = (item.confidence * 100).toFixed(1) + '%';
            const clsConf = item.qualityConfidence 
              ? (item.qualityConfidence * 100).toFixed(1) + '%' 
              : 'N/A';
            Alert.alert('Confidence Levels', \\\Variety Confidence: \\\\\nClass Confidence: \\\\);
          }} style={styles.eyeIconBtnGrid}>
            <MaterialIcons name="visibility" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>\;

code = code.replace(/<View style=\{styles.gridBadgeOverlay\}>\s*<ConfidenceBadge confidence=\{item.confidence\} size="sm" \/>\s*<\/View>/m, newGridBadge);

fs.writeFileSync('components/ui/item-card.tsx', code);

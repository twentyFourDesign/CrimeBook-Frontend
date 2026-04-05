const fs = require('fs');
const file = 'app/(citizen)/map.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("Platform.OS === 'web'")) {
  content = content.replace(
    'import { StatusBar } from "expo-status-bar";',
    'import { StatusBar } from "expo-status-bar";\nimport { Platform } from "react-native";'
  );
  
  content = content.replace(
    'export default function MapScreen() {',
    'export default function MapScreen() {\n  if (Platform.OS === "web") {\n    return (\n      <CitizenShell>\n        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>\n          <Text>Live Heatmap is not supported on the web platform.</Text>\n          <Text>Please test on an iOS or Android device/simulator.</Text>\n        </View>\n      </CitizenShell>\n    );\n  }'
  );
  
  fs.writeFileSync(file, content);
  console.log("Patched Web Map View");
}

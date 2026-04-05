const fs = require('fs');
const file = 'app.json';
let config = JSON.parse(fs.readFileSync(file, 'utf8'));

config.expo.android.config = config.expo.android.config || {};
config.expo.android.config.googleMaps = { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyB3yYXsHP0kKeBg1dgf97Ux6RTPh2x8Tvk' };

config.expo.ios.config = config.expo.ios.config || {};
config.expo.ios.config.googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyB3yYXsHP0kKeBg1dgf97Ux6RTPh2x8Tvk';

fs.writeFileSync(file, JSON.stringify(config, null, 2));
console.log("Patched app.json");

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// .sql 파일을 Metro 번들에 포함 (Drizzle 마이그레이션용)
config.resolver.assetExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });

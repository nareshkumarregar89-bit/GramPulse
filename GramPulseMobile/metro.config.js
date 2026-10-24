// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable cjs and firebase compatibility
config.resolver.sourceExts.push('cjs');

module.exports = config;

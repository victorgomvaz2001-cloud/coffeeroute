// Expo's Metro config detects the pnpm monorepo automatically (SDK 52+).
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

module.exports = withNativewind(getDefaultConfig(__dirname));

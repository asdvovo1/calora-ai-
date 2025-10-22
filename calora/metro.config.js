// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  url: require.resolve('react-native-url-polyfill'),
  events: require.resolve('events'),
  http: require.resolve('stream-http'),
  crypto: require.resolve('crypto-browserify'),
  https: require.resolve('https-browserify'),
  net: require.resolve('react-native-tcp-socket'),
  tls: require.resolve('react-native-tcp-socket'),

  // === أضف هذا السطر النهائي هنا ===
  zlib: require.resolve('browserify-zlib'),
  // ===================================
};

module.exports = config;
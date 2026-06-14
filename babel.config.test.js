// Simplified babel config for Jest — avoids react-native-worklets/plugin
// which is required by @react-native/jest-preset but not installed
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript'],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};

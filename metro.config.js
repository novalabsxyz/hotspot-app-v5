const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    extraNodeModules: {
      'iconv-lite': require.resolve('iconv-lite'),
      'iconv-lite/encodings': require.resolve('iconv-lite/encodings'),
    },
  },
}

// Ensure iconv-lite and its encodings are included in the build
const mergedConfig = mergeConfig(defaultConfig, config)
mergedConfig.resolver.assetExts.push('json') // Include JSON files for encodings

module.exports = mergedConfig

const createExpoWebpackConfigAsync = require("@expo/webpack-config")

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)

  // Polyfill Node.js built-ins for browser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer"),
    vm: false,
  }

  return config
}

module.exports = function override(config, env) {
  // Add webpack dev server configuration for allowedHosts
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      allowedHosts: 'all',
      host: '0.0.0.0',
      client: {
        webSocketURL: {
          hostname: 'localhost',
          port: '0'
        }
      }
    };
  }
  
  return config;
};

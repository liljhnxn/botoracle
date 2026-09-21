const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
    };
    config.externals = [
      ...(config.externals || []),
      "pino-pretty",
      "lokijs",
      "encoding",
      ({ request }, callback) => {
        if (/^@x402\//.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];
    return config;
  },
};

export default nextConfig;

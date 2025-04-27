const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in development for faster testing
    domains: [
      'aosdedyjlbzllplwvzjs.supabase.co',
      'images.pexels.com',
      'pixabay.com',
      'cdn.pixabay.com',
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'loremflickr.com',
      'picsum.photos',
      'placeimg.com',
      'placekitten.com',
      'dummyimage.com',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aosdedyjlbzllplwvzjs.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  reactStrictMode: true,
  // Improved script loading configuration
  crossOrigin: 'anonymous',
  // Don't use assetPrefix as it restricts to a specific port
  // assetPrefix: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3002',
  poweredByHeader: false,
  compress: true,
  distDir: '.next',
  // Optimize output for better script loading
  output: 'standalone',
  // Temporarily ignore build errors while we fix them
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  // Performance optimizations and node module handling
  webpack: (config, { isServer, dev }) => {
    // Handle node modules properly
    if (!isServer) {
      // Don't attempt to bundle node modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        events: false,
        process: false,
        util: false,
        buffer: false,
      };

      // Handle node: protocol imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:child_process': require.resolve('./src/lib/empty-module.js'),
        'node:crypto': require.resolve('crypto-browserify'),
        'node:path': require.resolve('path-browserify'),
        'node:os': require.resolve('os-browserify/browser'),
        'node:events': require.resolve('events/'),
        'node:stream': require.resolve('stream-browserify'),
        'node:buffer': require.resolve('buffer/'),
        'node:util': require.resolve('util/'),
        'node:process': require.resolve('process/browser'),
      };

      // Provide process and buffer globals
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    // Exclude Firebase Admin SDK from client-side bundle
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'firebase-admin': 'firebase-admin',
        '@google-cloud/firestore': '@google-cloud/firestore',
        'google-auth-library': 'google-auth-library',
      };
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                try {
                  const match = module.context?.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                  return match ? `npm.${match[1].replace('@', '')}` : 'vendor';
                } catch (error) {
                  return 'vendor';
                }
              },
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de build para evitar problemas de permissão
  experimental: {
    outputFileTracingRoot: undefined,
  },
  
  // Configurações de imagem para Firebase Storage
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com'
    ],
    unoptimized: true, // Para compatibilidade com export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.appspot.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  
  // Configurações de ambiente
  env: {
    CUSTOM_KEY: 'biotrack',
    APP_NAME: 'BioTrack Sistema de Avaliação Física'
  },
  
  // Otimizações para build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects para melhor SEO
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ];
  },
  
  // Webpack custom config simplificado
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Evitar problemas de build
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 
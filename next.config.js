/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações para deployment
  experimental: {
    appDir: false, // Usando Pages Router
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
  
  // Configurações de output para Vercel
  output: 'standalone',
  
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
  
  // Webpack custom config
  webpack: (config, { dev, isServer }) => {
    // Otimizações para production
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    
    return config;
  },
}

module.exports = nextConfig 
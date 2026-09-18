import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '英語クイズダンジョン Ultimate',
    short_name: '英語ダンジョン',
    description: 'AIが生成する無限英語クイズRPG',
    start_url: '/',
    display: 'standalone',
    background_color: '#070a13',
    theme_color: '#1e293b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

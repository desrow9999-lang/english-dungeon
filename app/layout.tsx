import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'クイズダンジョン Ultimate',
  description: '無限に遊べるAIクイズRPG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'クイズダンジョン Ultimate',
  description: 'AIと一緒に戦うクイズRPGゲーム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#020617' }}>
        {children}
      </body>
    </html>
  );
}

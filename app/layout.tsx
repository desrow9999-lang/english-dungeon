export const metadata = {
  title: '英語クイズダンジョン',
  description: 'AI英語クイズダンジョンRPG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}

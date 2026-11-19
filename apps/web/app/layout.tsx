// The <html> element lives in app/[locale]/layout.tsx (next-intl pattern); this root layout only passes through.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

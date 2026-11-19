import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { Masthead } from '@/components/layout/Masthead';
import { Footer } from '@/components/layout/Footer';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: site ? new URL(site) : undefined,
    title: { default: t('title'), template: `%s · Agre Jobs` },
    description: t('description'),
    alternates: { languages: { tr: '/tr', en: '/en' } },
    openGraph: { title: t('title'), description: t('description'), siteName: 'Agre Jobs', locale: locale === 'tr' ? 'tr_TR' : 'en_GB', type: 'website' },
  };
}

export const viewport: Viewport = { themeColor: '#121E2E' };

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations('nav');

  return (
    <html lang={locale}>
      <head>
        {/* Brand typefaces: Poppins (headings) + Montserrat (body); latin-ext covers ğ ş ı İ ç ö ü */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Montserrat:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="absolute -top-16 left-2 z-50 bg-agre-lime px-3 py-2 font-semibold text-agre-navy focus:top-2">
          {t('skip')}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Masthead />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

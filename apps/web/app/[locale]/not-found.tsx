import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-medium">{t('title')}</h1>
      <p className="mt-3 text-agre-muted">{t('body')}</p>
      <Link href="/" className="mt-6 inline-block bg-agre-navy px-4 py-2.5 text-sm font-semibold text-white no-underline">{t('back')}</Link>
    </section>
  );
}

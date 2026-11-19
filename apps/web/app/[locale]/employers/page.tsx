import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employers' });
  return { title: t('title'), description: t('lead') };
}

/** "İlan ver" until the employer dashboard exists: value points + a contact email (NEXT_PUBLIC_CONTACT_EMAIL). */
export default async function EmployersPage({ params }: { params: Promise<{ locale: 'tr' | 'en' }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('employers');
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const subject = encodeURIComponent(locale === 'tr' ? 'Agre Jobs ilan' : 'Agre Jobs listing');

  const points = [
    [t('point1Title'), t('point1Body')],
    [t('point2Title'), t('point2Body')],
    [t('point3Title'), t('point3Body')],
  ];

  return (
    <>
      <section className="on-navy bg-agre-navy text-[#E9EAE2]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <h1 className="max-w-[24ch] text-[clamp(28px,6vw,44px)] font-medium leading-tight text-white">{t('title')}</h1>
          <p className="mt-4 max-w-[56ch] font-poppins text-lg text-agre-lime">{t('lead')}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        {points.map(([title, body]) => (
          <div key={title} className="border border-[#DEDED0] bg-white p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-agre-muted">{body}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-3 bg-agre-lime p-7 text-agre-navy md:p-8">
          <h2 className="text-2xl font-medium">{t('contactTitle')}</h2>
          <p className="max-w-[56ch]">{t('contactBody')}</p>
          {email ? (
            <a href={`mailto:${email}?subject=${subject}`} className="mt-1 bg-agre-navy px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#1C2B40]">
              {t('contactButton')}: {email}
            </a>
          ) : (
            <p className="text-sm font-semibold">{t('contactPending')}</p>
          )}
        </div>
      </section>
    </>
  );
}

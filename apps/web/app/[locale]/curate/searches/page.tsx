import { buildSavedSearches } from '@agre/core';
import { requireCurator } from '@/lib/auth';

/** This week's saved searches on the four curator-only platforms (same list as the Monday digest). */
export default async function SavedSearchesPage({ params }: { params: Promise<{ locale: 'tr' | 'en' }> }) {
  await requireCurator();
  const { locale } = await params;
  const searches = buildSavedSearches(locale);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-poppins text-2xl font-semibold text-agre-ink">
        {locale === 'tr' ? 'Haftalık aramalar' : 'Weekly searches'}
      </h1>
      <p className="mt-2 font-montserrat text-sm text-agre-muted">
        {locale === 'tr'
          ? 'Her bağlantı platformun kendi arama sayfasını yeni sekmede açar. Uygun ilanları “İlan ekle” ile ekle.'
          : 'Each link opens the platform’s own search in a new tab. Add suitable roles with “Add a role”.'}
      </p>
      <table className="mt-6 w-full border-collapse font-montserrat text-sm">
        <thead>
          <tr className="border-b border-agre-sage/40 text-left text-agre-muted">
            <th className="py-2 pr-4 font-medium">{locale === 'tr' ? 'Alt sektör' : 'Subsector'}</th>
            <th className="py-2 pr-4 font-medium">{locale === 'tr' ? 'Arama' : 'Query'}</th>
            <th className="py-2 font-medium">{locale === 'tr' ? 'Platformlar' : 'Platforms'}</th>
          </tr>
        </thead>
        <tbody>
          {searches.map((s) => (
            <tr key={`${s.subsectorId}-${s.query}`} className="border-b border-agre-sage/20">
              <td className="py-2 pr-4 text-agre-ink">{s.label}</td>
              <td className="py-2 pr-4 font-medium text-agre-ink">{s.query}</td>
              <td className="py-2">
                {s.links.map((l, i) => (
                  <span key={l.platform}>
                    {i > 0 && ' · '}
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-agre-navy underline underline-offset-2">{l.label}</a>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

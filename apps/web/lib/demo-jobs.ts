import type { JobDoc } from './jobs';
import { HUBS } from '@agre/taxonomy';

/**
 * SAMPLE DATA for preview deployments and local development only (see lib/data.ts dataMode()).
 * Organizations are fictional ("Örnek" = "Sample") and links point to example.com.
 * Never shown on the production deployment.
 */
const day = 86_400;
const now = Math.floor(Date.now() / 1000);
const hub = (id: keyof typeof HUBS) => HUBS[id];

let n = 0;
const job = (j: Omit<JobDoc, 'id' | 'slug' | 'job_source_id' | 'is_native' | 'also_on'> & Partial<Pick<JobDoc, 'also_on'>>): JobDoc => {
  n++;
  const id = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  return { id, slug: `ornek-${n}`, job_source_id: id, is_native: false, also_on: [], ...j };
};

export const DEMO_JOBS: JobDoc[] = [
  job({ title: 'Ar-Ge Şefi', company_name: 'Örnek Gıda Atölyesi', sector: 'horeca-gastronomy', subsector: 'culinary-rnd',
    employment_type: 'full_time', work_mode: 'on_site', city: 'İstanbul', hub_label: hub('istanbul-marmara'),
    posted_at_ts: now - 0 * day, url: 'https://example.com/ilan/ar-ge-sefi', original_platform: 'kariyer_net', also_on: ['linkedin'] }),
  job({ title: 'Food Scientist – Plant-based Products', company_name: 'Sample Protein Labs', sector: 'foodtech', subsector: 'alt-protein',
    employment_type: 'full_time', work_mode: 'hybrid', city: 'İzmir', hub_label: hub('izmir-ege'),
    posted_at_ts: now - 1 * day, url: 'https://example.com/jobs/food-scientist', original_platform: 'linkedin' }),
  job({ title: 'Gıda Mühendisi (Kalite Güvence)', company_name: 'Örnek Zeytin Kooperatifi', sector: 'food-production-brands', subsector: 'olive-oil',
    employment_type: 'full_time', work_mode: 'on_site', city: 'Ayvalık', hub_label: hub('istanbul-marmara'),
    posted_at_ts: now - 2 * day, url: 'https://example.com/ilan/gida-muhendisi', original_platform: 'yenibiris' }),
  job({ title: 'Culinary Tour Host (Seasonal)', company_name: 'Örnek Lezzet Turları', sector: 'horeca-gastronomy', subsector: 'gastronomy-tourism',
    employment_type: 'seasonal', work_mode: 'travelling', city: 'Gaziantep', hub_label: hub('guneydogu-gap'),
    posted_at_ts: now - 2 * day, url: 'https://example.com/jobs/culinary-tour-host', original_platform: 'indeed' }),
  job({ title: 'Ziraat Mühendisi – Rejeneratif Tarım', company_name: 'Örnek Toprak Girişimi', sector: 'agroecology', subsector: 'regenerative-soil',
    employment_type: 'full_time', work_mode: 'on_site', city: 'Konya', hub_label: hub('ankara-ic-anadolu'),
    posted_at_ts: now - 3 * day, url: 'https://example.com/ilan/ziraat-muhendisi', original_platform: 'kariyer_net' }),
  job({ title: 'Food Innovation Consultant', company_name: 'Sample Food Ventures', sector: 'food-production-brands', subsector: 'branded-fmcg',
    employment_type: 'project_freelance', work_mode: 'remote', city: null, hub_label: hub('remote'),
    posted_at_ts: now - 4 * day, url: 'https://example.com/careers/innovation-consultant', original_platform: 'company_site' }),
  job({ title: 'Sera Operasyon Sorumlusu', company_name: 'Örnek Sera Teknolojileri', sector: 'urban-cea', subsector: 'commercial-greenhouses',
    employment_type: 'full_time', work_mode: 'on_site', city: 'Antalya', hub_label: hub('antalya-akdeniz'),
    posted_at_ts: now - 5 * day, url: 'https://example.com/ilan/sera-operasyon', original_platform: 'yenibiris' }),
  job({ title: 'Precision Agriculture Data Analyst', company_name: 'Sample AgTech', sector: 'agtech', subsector: 'farm-software',
    employment_type: 'full_time', work_mode: 'hybrid', city: 'Ankara', hub_label: hub('ankara-ic-anadolu'),
    posted_at_ts: now - 6 * day, url: 'https://example.com/careers/data-analyst', original_platform: 'company_site' }),
  job({ title: 'Fındık İhracat Uzmanı', company_name: 'Örnek Karadeniz Tarım', sector: 'supply-chain-trade', subsector: 'export-import',
    employment_type: 'full_time', work_mode: 'on_site', city: 'Ordu', hub_label: hub('karadeniz'),
    posted_at_ts: now - 7 * day, url: 'https://example.com/ilan/findik-ihracat', original_platform: 'kariyer_net' }),
  job({ title: 'Food Entrepreneur in Residence', company_name: 'Sample Agrifood Accelerator', sector: 'ecosystem', subsector: 'investors-accelerators',
    employment_type: 'fellowship', work_mode: 'hybrid', city: 'İstanbul', hub_label: hub('istanbul-marmara'),
    posted_at_ts: now - 8 * day, url: 'https://example.com/programs/eir', original_platform: 'linkedin' }),
  job({ title: 'Sezonluk Aşçı – Zeytinyağlılar', company_name: 'Örnek Butik Otel', sector: 'horeca-gastronomy', subsector: 'hotels-resorts',
    employment_type: 'seasonal', work_mode: 'on_site', city: 'Bodrum', hub_label: hub('izmir-ege'),
    posted_at_ts: now - 9 * day, url: 'https://example.com/ilan/sezonluk-asci', original_platform: 'indeed' }),
  job({ title: 'Su Ürünleri Yetiştiricilik Teknikeri', company_name: 'Örnek Su Ürünleri', sector: 'livestock-aquaculture', subsector: 'aquaculture',
    employment_type: 'full_time', work_mode: 'on_site', city: 'Muğla', hub_label: hub('izmir-ege'),
    posted_at_ts: now - 11 * day, url: 'https://example.com/ilan/su-urunleri', original_platform: 'careerjet' }),
];

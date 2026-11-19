/** Function, contract and work-mode facets from the PRD (Section 2). */

export const FUNCTIONS = [
  { id: 'agronomy-field', tr: 'Agronomi ve saha', en: 'Agronomy & field operations',
    keywords: ['ziraat mühendisi', 'agronomist', 'agronom', 'saha mühendisi', 'bitki koruma', 'field agronomist'] },
  { id: 'culinary', tr: 'Mutfak', en: 'Culinary',
    keywords: ['şef', 'aşçı', 'chef', 'cook', 'pastry', 'pastacı', 'mutfak', 'culinary'] },
  { id: 'hospitality-ops', tr: 'Konaklama operasyonu', en: 'Hospitality operations',
    keywords: ['restoran müdürü', 'restaurant manager', 'f&b', 'yiyecek içecek', 'tur rehberi', 'tour host', 'tour guide'] },
  { id: 'food-science-qa', tr: 'Gıda bilimi, kalite ve güvenlik', en: 'Food science, quality & safety',
    keywords: ['gıda mühendisi', 'food scientist', 'gıda bilimci', 'gıda teknoloğu', 'food technologist', 'kalite', 'quality', 'haccp', 'ar-ge', 'r&d'] },
  { id: 'engineering', tr: 'Mühendislik', en: 'Engineering',
    keywords: ['mühendis', 'engineer', 'teknisyen', 'technician'] },
  { id: 'product-software', tr: 'Ürün ve yazılım', en: 'Product & software',
    keywords: ['yazılım', 'software', 'developer', 'geliştirici', 'product manager', 'ürün yöneticisi'] },
  { id: 'data', tr: 'Veri ve analitik', en: 'Data & analytics',
    keywords: ['veri', 'data', 'analist', 'analyst'] },
  { id: 'supply-procurement', tr: 'Tedarik zinciri ve satın alma', en: 'Supply chain & procurement',
    keywords: ['satın alma', 'procurement', 'tedarik', 'supply chain', 'lojistik', 'logistics'] },
  { id: 'sales-export', tr: 'Satış ve ihracat', en: 'Sales & export',
    keywords: ['satış', 'sales', 'ihracat', 'export', 'dış ticaret', 'business development', 'iş geliştirme'] },
  { id: 'marketing-brand', tr: 'Pazarlama ve marka', en: 'Marketing & brand',
    keywords: ['pazarlama', 'marketing', 'marka', 'brand', 'içerik', 'content'] },
  { id: 'sustainability-esg', tr: 'Sürdürülebilirlik ve ESG', en: 'Sustainability & ESG',
    keywords: ['sürdürülebilirlik', 'sustainability', 'esg', 'karbon', 'carbon'] },
  { id: 'research', tr: 'Araştırma', en: 'Research',
    keywords: ['araştırmacı', 'researcher', 'research', 'araştırma görevlisi', 'scientist'] },
  { id: 'programmes-policy', tr: 'Program ve politika', en: 'Programmes & policy',
    keywords: ['program yöneticisi', 'programme manager', 'program manager', 'policy', 'politika', 'proje uzmanı'] },
  { id: 'operations-management', tr: 'Operasyon ve yönetim', en: 'Operations & management',
    keywords: ['operasyon', 'operations', 'müdür', 'manager', 'işletme', 'genel müdür', 'founder', 'kurucu', 'entrepreneur', 'girişimci', 'consultant', 'danışman'] },
  { id: 'finance-investment', tr: 'Finans ve yatırım', en: 'Finance & investment',
    keywords: ['finans', 'finance', 'yatırım', 'investment', 'muhasebe', 'accounting'] },
  { id: 'people-admin', tr: 'İnsan kaynakları ve idari', en: 'People & admin',
    keywords: ['insan kaynakları', 'human resources', 'hr ', 'idari', 'admin'] },
] as const;

export type FunctionId = (typeof FUNCTIONS)[number]['id'];

export const EMPLOYMENT_TYPES = [
  'full_time', 'part_time', 'seasonal', 'project_freelance', 'internship',
  'stage', 'apprenticeship', 'fellowship', 'volunteer',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ['on_site', 'hybrid', 'remote', 'travelling'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

/** The platforms a listing can originally come from, shown as the source badge. */
export const PLATFORMS = {
  linkedin: 'LinkedIn',
  kariyer_net: 'Kariyer.net',
  yenibiris: 'YeniBirİş',
  indeed: 'Indeed',
  careerjet: 'Careerjet',
  company_site: 'Company site',
  agre_jobs: 'Agre Jobs',
} as const;
export type PlatformKey = keyof typeof PLATFORMS;

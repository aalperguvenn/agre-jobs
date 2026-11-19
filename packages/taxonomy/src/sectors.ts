/**
 * Sector taxonomy from the Agre Jobs PRD & MVP Blueprint, Section 2.
 * 10 sectors, 55 subsectors. Keywords are matched after Turkish-aware folding
 * (see @agre/core fold()), so write them naturally in Turkish or English.
 *
 * Owner: taxonomy owner on the Agre team. Members can suggest tags; only the
 * owner edits this file (monthly review).
 */

export interface Subsector {
  id: string;
  label: { tr: string; en: string };
  /** Turkish search terms. The first 3 are also used to build weekly queries. */
  keywordsTr: string[];
  /** English search terms. The first 2 are also used to build weekly queries. */
  keywordsEn: string[];
}

export interface Sector {
  id: string;
  label: { tr: string; en: string };
  subsectors: Subsector[];
}

const s = (
  id: string,
  tr: string,
  en: string,
  keywordsTr: string[],
  keywordsEn: string[],
): Subsector => ({ id, label: { tr, en }, keywordsTr, keywordsEn });

export const SECTORS: Sector[] = [
  {
    id: 'agroecology',
    label: { tr: 'Agroekoloji', en: 'Agroecology & Regenerative Ag' },
    subsectors: [
      s('regenerative-soil', 'Rejeneratif tarım ve toprak sağlığı', 'Regenerative & soil health',
        ['rejeneratif tarım', 'toprak sağlığı', 'toprak bilimi', 'karbon tarımı'],
        ['regenerative agriculture', 'soil health', 'soil scientist']),
      s('organic-farming', 'Organik tarım', 'Organic farming',
        ['organik tarım', 'organik üretim', 'ekolojik tarım'],
        ['organic farming', 'organic farm']),
      s('permaculture-agroforestry', 'Permakültür ve tarımsal ormancılık', 'Permaculture & agroforestry',
        ['permakültür', 'tarımsal ormancılık', 'agroforestri'],
        ['permaculture', 'agroforestry']),
      s('heirloom-seeds', 'Yerel ve ata tohumları', 'Local & heirloom seeds',
        ['ata tohumu', 'yerel tohum', 'tohum ıslahı', 'tohumculuk'],
        ['heirloom seed', 'seed breeding', 'plant breeder']),
      s('farm-biodiversity', 'Tarımsal biyoçeşitlilik', 'Farm biodiversity',
        ['tarımsal biyoçeşitlilik', 'biyoçeşitlilik', 'tozlayıcı'],
        ['farm biodiversity', 'pollinator']),
    ],
  },
  {
    id: 'agtech',
    label: { tr: 'Tarım Teknolojisi', en: 'AgTech & Precision Ag' },
    subsectors: [
      s('farm-software', 'Tarım yazılımı ve veri', 'Farm software & data',
        ['tarım yazılımı', 'dijital tarım', 'tarım veri'],
        ['agtech software', 'farm management software', 'digital agriculture']),
      s('sensors-iot', 'Sensörler ve IoT', 'Sensors & IoT',
        ['tarım sensör', 'akıllı tarım', 'tarımsal iot'],
        ['smart farming', 'agricultural iot']),
      s('drones-robotics', 'Drone ve robotik', 'Drones & robotics',
        ['tarım drone', 'tarımsal drone', 'tarım robotu'],
        ['agricultural drone', 'agricultural robotics']),
      s('smart-irrigation', 'Akıllı sulama', 'Smart irrigation',
        ['akıllı sulama', 'damla sulama', 'sulama mühendisi', 'sulama sistemleri'],
        ['irrigation engineer', 'smart irrigation', 'drip irrigation']),
      s('greenhouse-tech', 'Sera teknolojisi', 'Greenhouse tech',
        ['sera teknolojisi', 'sera otomasyonu', 'sera mühendisi'],
        ['greenhouse technology', 'greenhouse automation']),
      s('ag-biotech-inputs', 'Tarımsal biyoteknoloji ve girdiler', 'Ag biotech & inputs',
        ['biyogübre', 'biyolojik mücadele', 'zirai ilaç', 'gübre', 'tarımsal biyoteknoloji'],
        ['biostimulant', 'crop protection', 'agricultural biotechnology']),
    ],
  },
  {
    id: 'foodtech',
    label: { tr: 'Gıda Teknolojisi', en: 'Food Tech & Innovation' },
    subsectors: [
      s('alt-protein', 'Alternatif proteinler', 'Alternative proteins',
        ['alternatif protein', 'bitkisel protein', 'bitki bazlı'],
        ['alternative protein', 'plant-based', 'cultivated meat']),
      s('fermentation', 'Fermantasyon', 'Fermentation',
        ['fermantasyon', 'fermente'],
        ['fermentation scientist', 'precision fermentation']),
      s('functional-foods', 'Fonksiyonel ve sağlıklı gıdalar', 'Functional & healthy foods',
        ['fonksiyonel gıda', 'sağlıklı gıda', 'gıda bilimci', 'gıda teknoloğu', 'ürün geliştirme'],
        ['food scientist', 'food technologist', 'functional food', 'new product development']),
      s('food-safety-tech', 'Gıda güvenliği teknolojisi', 'Food safety tech',
        ['gıda güvenliği', 'kalite güvence', 'haccp'],
        ['food safety', 'quality assurance food']),
      s('sustainable-packaging', 'Sürdürülebilir ambalaj', 'Sustainable packaging',
        ['sürdürülebilir ambalaj', 'biyobozunur ambalaj', 'gıda ambalajı'],
        ['sustainable packaging', 'compostable packaging']),
      s('upcycled-food', 'Değerlendirilmiş (upcycled) gıda', 'Upcycled food',
        ['yan ürün değerlendirme', 'gıda yan ürünleri'],
        ['upcycled food', 'food by-products']),
    ],
  },
  {
    id: 'food-production-brands',
    label: { tr: 'Gıda Üretimi & Markalar', en: 'Food Production & Brands' },
    subsectors: [
      s('artisanal-producers', 'Zanaatkâr ve butik üreticiler', 'Artisanal & craft producers',
        ['butik üretim', 'zanaat gıda', 'el yapımı', 'yerel üretici'],
        ['artisanal food', 'craft producer']),
      s('branded-fmcg', 'Markalı hızlı tüketim', 'Branded FMCG',
        ['gıda markası', 'hızlı tüketim gıda', 'gıda mühendisi', 'gıda inovasyon'],
        ['food brand', 'fmcg food', 'food innovation consultant', 'food entrepreneur']),
      s('dairy-cheese', 'Süt ve peynir', 'Dairy & cheese',
        ['süt ürünleri', 'peynir', 'mandıra'],
        ['dairy', 'cheesemaker']),
      s('olive-oil', 'Zeytin ve zeytinyağı', 'Olive & olive oil',
        ['zeytinyağı', 'zeytin', 'zeytinlik'],
        ['olive oil']),
      s('bakery-confectionery', 'Fırın ve şekerleme', 'Bakery & confectionery',
        ['fırın', 'unlu mamul', 'pastane', 'şekerleme', 'çikolata'],
        ['bakery', 'confectionery', 'chocolatier']),
      s('wine-beverages', 'Şarap ve içecek', 'Wine & beverages',
        ['şarap', 'bağcılık', 'içecek', 'kahve kavurma'],
        ['winemaker', 'viticulture', 'beverage']),
    ],
  },
  {
    id: 'horeca-gastronomy',
    label: { tr: 'HORECA & Sürdürülebilir Gastronomi', en: 'HORECA & Sustainable Gastronomy' },
    subsectors: [
      s('restaurants-fine-dining', 'Restoran ve fine dining', 'Restaurants & fine dining',
        ['aşçı', 'şef', 'sous chef', 'aşçıbaşı', 'restoran'],
        ['chef', 'sous chef', 'line cook', 'fine dining']),
      s('hotels-resorts', 'Otel ve tatil köyleri', 'Hotels & resorts',
        ['otel mutfak', 'yiyecek içecek müdürü', 'f&b'],
        ['food and beverage manager', 'hotel kitchen']),
      s('catering-institutional', 'Catering ve toplu yemek', 'Catering & institutional food',
        ['catering', 'toplu yemek', 'yemek fabrikası'],
        ['catering', 'contract catering']),
      s('culinary-rnd', 'Mutfak Ar-Ge', 'Culinary R&D',
        ['ar-ge şefi', 'arge şefi', 'araştırma geliştirme şefi', 'mutfak ar-ge', 'menü geliştirme'],
        ['r&d chef', 'development chef', 'culinary r&d', 'research chef']),
      s('zero-waste-kitchens', 'Sıfır atık mutfaklar', 'Zero-waste kitchens',
        ['sıfır atık mutfak', 'mutfak atığı'],
        ['zero waste kitchen']),
      s('gastronomy-tourism', 'Gastronomi turizmi', 'Gastronomy tourism',
        ['gastronomi turu', 'yemek turu', 'gastronomi turizmi', 'tur rehberi gastronomi'],
        ['culinary tour host', 'food tour guide', 'culinary tourism']),
    ],
  },
  {
    id: 'supply-chain-trade',
    label: { tr: 'Tedarik Zinciri & Ticaret', en: 'Supply Chain & Trade' },
    subsectors: [
      s('cold-chain-logistics', 'Soğuk zincir ve lojistik', 'Cold chain & logistics',
        ['soğuk zincir', 'gıda lojistiği'],
        ['cold chain', 'food logistics']),
      s('sourcing-procurement', 'Tedarik ve satın alma', 'Sourcing & procurement',
        ['tarımsal satın alma', 'hammadde tedarik', 'gıda satın alma'],
        ['agricultural sourcing', 'food procurement']),
      s('export-import', 'İhracat ve ithalat', 'Export & import',
        ['gıda ihracat', 'tarım ihracat', 'kuru meyve ihracat', 'fındık ihracat'],
        ['food export', 'agri export']),
      s('wholesale-markets', 'Toptan ve hal', 'Wholesale & markets',
        ['hal', 'toptan meyve sebze', 'toptan gıda'],
        ['fresh produce wholesale']),
      s('traceability', 'İzlenebilirlik', 'Traceability',
        ['izlenebilirlik', 'gıda izlenebilirlik'],
        ['traceability', 'food traceability']),
      s('cooperatives', 'Kooperatifler', 'Cooperatives',
        ['kooperatif', 'tarımsal kalkınma kooperatifi', 'üretici birliği'],
        ['cooperative', 'farmer cooperative']),
    ],
  },
  {
    id: 'urban-cea',
    label: { tr: 'Kentsel & Kontrollü Tarım', en: 'Urban & Controlled-Environment Farming' },
    subsectors: [
      s('vertical-farming', 'Dikey tarım', 'Vertical farming',
        ['dikey tarım', 'dikey çiftlik'],
        ['vertical farming', 'vertical farm']),
      s('hydroponics-aquaponics', 'Topraksız tarım ve akuaponik', 'Hydroponics & aquaponics',
        ['topraksız tarım', 'hidroponik', 'akuaponik'],
        ['hydroponics', 'aquaponics']),
      s('commercial-greenhouses', 'Ticari seralar', 'Commercial greenhouses',
        ['sera', 'seracılık', 'örtü altı'],
        ['greenhouse grower', 'greenhouse manager']),
      s('urban-gardens', 'Çatı ve topluluk bahçeleri', 'Rooftop & community gardens',
        ['kent bostanı', 'topluluk bahçesi', 'çatı bahçesi'],
        ['urban farming', 'community garden']),
    ],
  },
  {
    id: 'climate-water-circularity',
    label: { tr: 'İklim, Su & Döngüsellik', en: 'Climate, Water & Circularity' },
    subsectors: [
      s('water-efficiency', 'Su verimliliği', 'Water efficiency',
        ['su verimliliği', 'tarımsal su', 'su yönetimi'],
        ['water efficiency', 'agricultural water']),
      s('climate-adaptation', 'Kuraklık ve iklim uyumu', 'Drought & climate adaptation',
        ['iklim uyumu', 'kuraklık', 'iklim değişikliği tarım'],
        ['climate adaptation', 'drought resilience']),
      s('soil-carbon-mrv', 'Toprak karbonu ve MRV', 'Soil carbon & MRV',
        ['toprak karbonu', 'karbon ayak izi gıda'],
        ['soil carbon', 'carbon mrv']),
      s('food-loss-waste', 'Gıda kaybı ve israfı', 'Food loss & waste',
        ['gıda israfı', 'gıda kaybı'],
        ['food waste', 'food loss']),
      s('composting-bioinputs', 'Kompost ve biyo-girdiler', 'Composting & bio-inputs',
        ['kompost', 'solucan gübresi', 'organik gübre'],
        ['composting', 'bio-inputs']),
    ],
  },
  {
    id: 'livestock-aquaculture',
    label: { tr: 'Hayvancılık & Su Ürünleri', en: 'Livestock, Aquaculture & Fisheries' },
    subsectors: [
      s('livestock-dairy-farming', 'Hayvancılık ve süt çiftliği', 'Livestock & dairy farming',
        ['hayvancılık', 'süt çiftliği', 'zootekni', 'besi'],
        ['livestock', 'dairy farm']),
      s('animal-health-feed', 'Hayvan sağlığı ve yem', 'Animal health & feed',
        ['veteriner hekim', 'yem', 'hayvan besleme'],
        ['veterinarian', 'animal nutrition', 'feed']),
      s('aquaculture', 'Su ürünleri yetiştiriciliği', 'Aquaculture',
        ['su ürünleri', 'balık çiftliği', 'akuakültür'],
        ['aquaculture', 'fish farm']),
      s('sustainable-fisheries', 'Sürdürülebilir balıkçılık', 'Sustainable fisheries',
        ['balıkçılık', 'sürdürülebilir balıkçılık'],
        ['fisheries']),
      s('apiculture', 'Arıcılık', 'Apiculture',
        ['arıcılık', 'bal üretimi'],
        ['beekeeping', 'apiculture']),
    ],
  },
  {
    id: 'ecosystem',
    label: { tr: 'Ekosistem', en: 'Finance, Policy & Ecosystem' },
    subsectors: [
      s('agri-finance-insurance', 'Tarım finansmanı ve sigorta', 'Agri-finance & insurance',
        ['tarım kredisi', 'tarım sigortası', 'tarsim'],
        ['agri finance', 'agricultural insurance']),
      s('investors-accelerators', 'Yatırımcılar ve hızlandırıcılar', 'Investors & accelerators',
        ['agritech yatırım', 'gıda girişimcisi', 'girişim hızlandırıcı tarım'],
        ['agrifood investor', 'food entrepreneur', 'accelerator food']),
      s('public-policy', 'Kamu ve politika', 'Public sector & policy',
        ['tarım politikası', 'tarım ve orman bakanlığı'],
        ['agricultural policy', 'food policy']),
      s('ngos-development', 'STK ve kalkınma', 'NGOs & development',
        ['kırsal kalkınma', 'tarımsal kalkınma', 'gıda güvencesi'],
        ['rural development', 'food security', 'fao']),
      s('research-academia', 'Araştırma ve akademi', 'Research & academia',
        ['ziraat fakültesi', 'tarımsal araştırma', 'gıda araştırma'],
        ['agricultural research', 'food research']),
      s('education-training', 'Eğitim', 'Education & training',
        ['gastronomi eğitmeni', 'aşçılık eğitmeni', 'tarım eğitimi'],
        ['culinary instructor', 'agricultural extension']),
      s('food-media', 'Gıda medyası ve hikâye anlatıcılığı', 'Food media & storytelling',
        ['yemek yazarı', 'gastronomi editörü', 'yemek içerik'],
        ['food writer', 'food content creator']),
    ],
  },
];

/** Words that block a match (generic retail and unrelated roles that share food words). */
export const NEGATIVE_KEYWORDS: string[] = [
  'kasiyer', 'market reyon', 'reyon görevlisi', 'kurye', 'moto kurye', 'garson komi',
  'call center', 'çağrı merkezi', 'cashier', 'delivery driver',
];

export const ALL_SUBSECTORS = SECTORS.flatMap((sec) =>
  sec.subsectors.map((sub) => ({ ...sub, sectorId: sec.id })),
);

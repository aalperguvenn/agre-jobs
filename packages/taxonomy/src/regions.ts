/**
 * Regional hubs from the PRD (Section 2). All 81 Turkish provinces map to exactly one hub.
 */

export type HubId =
  | 'istanbul-marmara'
  | 'izmir-ege'
  | 'antalya-akdeniz'
  | 'ankara-ic-anadolu'
  | 'karadeniz'
  | 'guneydogu-gap'
  | 'dogu-anadolu'
  | 'trakya'
  | 'balkans'
  | 'caucasus'
  | 'middle-east-gulf'
  | 'northern-cyprus'
  | 'europe'
  | 'remote';

export const HUBS: Record<HubId, { tr: string; en: string }> = {
  'istanbul-marmara': { tr: 'İstanbul & Marmara', en: 'İstanbul & Marmara' },
  'izmir-ege': { tr: 'İzmir & Ege', en: 'İzmir & Aegean' },
  'antalya-akdeniz': { tr: 'Antalya & Akdeniz', en: 'Antalya & Mediterranean' },
  'ankara-ic-anadolu': { tr: 'Ankara & İç Anadolu', en: 'Ankara & Central Anatolia' },
  karadeniz: { tr: 'Karadeniz', en: 'Black Sea' },
  'guneydogu-gap': { tr: 'Güneydoğu & GAP', en: 'Southeast & GAP' },
  'dogu-anadolu': { tr: 'Doğu Anadolu', en: 'Eastern Anatolia' },
  trakya: { tr: 'Trakya', en: 'Thrace' },
  balkans: { tr: 'Balkanlar', en: 'Balkans' },
  caucasus: { tr: 'Kafkasya', en: 'Caucasus' },
  'middle-east-gulf': { tr: 'Orta Doğu & Körfez', en: 'Middle East & Gulf' },
  'northern-cyprus': { tr: 'Kuzey Kıbrıs', en: 'Northern Cyprus' },
  europe: { tr: 'Avrupa', en: 'Europe' },
  remote: { tr: 'Uzaktan', en: 'Remote' },
};

/** 81 provinces → hub. Keys are the official province names. */
export const PROVINCE_HUB: Record<string, HubId> = {
  // Trakya (3)
  Edirne: 'trakya', Kırklareli: 'trakya', Tekirdağ: 'trakya',
  // İstanbul & Marmara (8)
  İstanbul: 'istanbul-marmara', Kocaeli: 'istanbul-marmara', Sakarya: 'istanbul-marmara',
  Yalova: 'istanbul-marmara', Bursa: 'istanbul-marmara', Bilecik: 'istanbul-marmara',
  Balıkesir: 'istanbul-marmara', Çanakkale: 'istanbul-marmara',
  // İzmir & Ege (8)
  İzmir: 'izmir-ege', Manisa: 'izmir-ege', Aydın: 'izmir-ege', Denizli: 'izmir-ege',
  Muğla: 'izmir-ege', Uşak: 'izmir-ege', Kütahya: 'izmir-ege', Afyonkarahisar: 'izmir-ege',
  // Antalya & Akdeniz (8)
  Antalya: 'antalya-akdeniz', Mersin: 'antalya-akdeniz', Adana: 'antalya-akdeniz',
  Hatay: 'antalya-akdeniz', Osmaniye: 'antalya-akdeniz', Kahramanmaraş: 'antalya-akdeniz',
  Isparta: 'antalya-akdeniz', Burdur: 'antalya-akdeniz',
  // Ankara & İç Anadolu (13)
  Ankara: 'ankara-ic-anadolu', Konya: 'ankara-ic-anadolu', Kayseri: 'ankara-ic-anadolu',
  Eskişehir: 'ankara-ic-anadolu', Sivas: 'ankara-ic-anadolu', Yozgat: 'ankara-ic-anadolu',
  Kırıkkale: 'ankara-ic-anadolu', Kırşehir: 'ankara-ic-anadolu', Nevşehir: 'ankara-ic-anadolu',
  Niğde: 'ankara-ic-anadolu', Aksaray: 'ankara-ic-anadolu', Karaman: 'ankara-ic-anadolu',
  Çankırı: 'ankara-ic-anadolu',
  // Karadeniz (18)
  Samsun: 'karadeniz', Trabzon: 'karadeniz', Ordu: 'karadeniz', Giresun: 'karadeniz',
  Rize: 'karadeniz', Artvin: 'karadeniz', Sinop: 'karadeniz', Kastamonu: 'karadeniz',
  Bartın: 'karadeniz', Zonguldak: 'karadeniz', Karabük: 'karadeniz', Düzce: 'karadeniz',
  Bolu: 'karadeniz', Amasya: 'karadeniz', Tokat: 'karadeniz', Çorum: 'karadeniz',
  Gümüşhane: 'karadeniz', Bayburt: 'karadeniz',
  // Güneydoğu & GAP (9)
  Gaziantep: 'guneydogu-gap', Şanlıurfa: 'guneydogu-gap', Diyarbakır: 'guneydogu-gap',
  Mardin: 'guneydogu-gap', Batman: 'guneydogu-gap', Siirt: 'guneydogu-gap',
  Şırnak: 'guneydogu-gap', Adıyaman: 'guneydogu-gap', Kilis: 'guneydogu-gap',
  // Doğu Anadolu (14)
  Erzurum: 'dogu-anadolu', Erzincan: 'dogu-anadolu', Kars: 'dogu-anadolu', Ardahan: 'dogu-anadolu',
  Iğdır: 'dogu-anadolu', Ağrı: 'dogu-anadolu', Van: 'dogu-anadolu', Muş: 'dogu-anadolu',
  Bitlis: 'dogu-anadolu', Hakkari: 'dogu-anadolu', Bingöl: 'dogu-anadolu', Tunceli: 'dogu-anadolu',
  Elazığ: 'dogu-anadolu', Malatya: 'dogu-anadolu',
};

/** Districts and common place names that job sites print instead of the province. */
export const PLACE_ALIASES: Record<string, string> = {
  'istanbul(asya)': 'İstanbul', 'istanbul(avrupa)': 'İstanbul', 'istanbul asya': 'İstanbul',
  'istanbul avrupa': 'İstanbul', kadıköy: 'İstanbul', beşiktaş: 'İstanbul', şişli: 'İstanbul',
  ataşehir: 'İstanbul', ümraniye: 'İstanbul', beyoğlu: 'İstanbul', sarıyer: 'İstanbul',
  gebze: 'Kocaeli', izmit: 'Kocaeli', adapazarı: 'Sakarya',
  çeşme: 'İzmir', urla: 'İzmir', şirince: 'İzmir', selçuk: 'İzmir', torbalı: 'İzmir',
  bodrum: 'Muğla', fethiye: 'Muğla', marmaris: 'Muğla', ayvalık: 'Balıkesir', bozcaada: 'Çanakkale',
  alanya: 'Antalya', kemer: 'Antalya', belek: 'Antalya', serik: 'Antalya', manavgat: 'Antalya', kaş: 'Antalya',
  antakya: 'Hatay', iskenderun: 'Hatay', tarsus: 'Mersin',
  kapadokya: 'Nevşehir', ürgüp: 'Nevşehir', göreme: 'Nevşehir',
  'afyon': 'Afyonkarahisar', 'k.maraş': 'Kahramanmaraş', maraş: 'Kahramanmaraş', urfa: 'Şanlıurfa',
  antep: 'Gaziantep',
};

/** Countries outside Türkiye that the PRD's regional scope covers. */
export const COUNTRY_HUB: Record<string, HubId> = {
  // Balkans
  greece: 'balkans', yunanistan: 'balkans', bulgaria: 'balkans', bulgaristan: 'balkans',
  albania: 'balkans', arnavutluk: 'balkans', 'north macedonia': 'balkans', 'kuzey makedonya': 'balkans',
  kosovo: 'balkans', kosova: 'balkans', bosnia: 'balkans', bosna: 'balkans', serbia: 'balkans',
  sırbistan: 'balkans', montenegro: 'balkans', karadağ: 'balkans', romania: 'balkans', romanya: 'balkans',
  croatia: 'balkans', hırvatistan: 'balkans',
  // Caucasus
  georgia: 'caucasus', gürcistan: 'caucasus', azerbaijan: 'caucasus', azerbaycan: 'caucasus',
  armenia: 'caucasus', ermenistan: 'caucasus',
  // Middle East & Gulf
  'united arab emirates': 'middle-east-gulf', uae: 'middle-east-gulf', bae: 'middle-east-gulf',
  'birleşik arap emirlikleri': 'middle-east-gulf', dubai: 'middle-east-gulf', 'abu dhabi': 'middle-east-gulf',
  'saudi arabia': 'middle-east-gulf', 'suudi arabistan': 'middle-east-gulf', qatar: 'middle-east-gulf',
  katar: 'middle-east-gulf', kuwait: 'middle-east-gulf', kuveyt: 'middle-east-gulf', bahrain: 'middle-east-gulf',
  oman: 'middle-east-gulf', umman: 'middle-east-gulf', jordan: 'middle-east-gulf', ürdün: 'middle-east-gulf',
  lebanon: 'middle-east-gulf', lübnan: 'middle-east-gulf', iraq: 'middle-east-gulf', irak: 'middle-east-gulf',
  egypt: 'middle-east-gulf', mısır: 'middle-east-gulf',
  // Northern Cyprus
  'northern cyprus': 'northern-cyprus', kktc: 'northern-cyprus', 'kuzey kıbrıs': 'northern-cyprus',
  lefkoşa: 'northern-cyprus', girne: 'northern-cyprus', gazimağusa: 'northern-cyprus', nicosia: 'northern-cyprus',
  // Europe (diaspora roles)
  germany: 'europe', almanya: 'europe', netherlands: 'europe', hollanda: 'europe', belgium: 'europe',
  belçika: 'europe', france: 'europe', fransa: 'europe', austria: 'europe', avusturya: 'europe',
  'united kingdom': 'europe', 'birleşik krallık': 'europe', ingiltere: 'europe', spain: 'europe',
  ispanya: 'europe', italy: 'europe', italya: 'europe', switzerland: 'europe', isviçre: 'europe',
  sweden: 'europe', isveç: 'europe', denmark: 'europe', danimarka: 'europe',
};

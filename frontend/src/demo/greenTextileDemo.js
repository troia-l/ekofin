export const GREEN_TEXTILE_TICKER = 'YESTK';
const STORAGE_KEY = 'ecofin-green-textile-demo-v1';

export const GREEN_TEXTILE_DEMO = {
  company: {
    name: 'Yeşil Tekstil A.Ş.',
    ticker: GREEN_TEXTILE_TICKER,
    sector: 'Tekstil ürünleri imalatı',
    location: 'Bursa, Türkiye',
    employeeCount: 286,
    founded: 2008,
    score: 7.6,
    riskLevel: 'Düşük-Orta Risk',
    scoreHistory: [
      { date: 'Oca', score: 6.8 },
      { date: 'Nis', score: 7.0 },
      { date: 'Tem', score: 7.3 },
      { date: 'Eki', score: 7.6 },
    ],
  },
  metrics: {
    electricityKwh: 1842000,
    naturalGasM3: 246000,
    waterM3: 68400,
    scope1Tons: 512,
    scope2Tons: 846,
    scope3Tons: 3240,
    recycledWaterPct: 31,
    recycledMaterialPct: 24,
    injuryFrequency: 1.8,
    womenInWorkforcePct: 42,
    esgPillars: { e: 78, s: 82, g: 76 },
  },
  credibility: {
    demo: true,
    company_name: 'Yeşil Tekstil A.Ş. (sentetik demo)',
    pillars: {
      E: { reliability: 0.78, evidence_adequacy: 0.81, reason: 'Enerji, su ve atık örnek kaynakları eşleştirildi; değerler sentetiktir.', evidence: [] },
      S: { reliability: 0.82, evidence_adequacy: 0.77, reason: 'Çalışan ve İSG göstergeleri örnek beyan alanlarıyla ilişkilendirildi.', evidence: [] },
      G: { reliability: 0.76, evidence_adequacy: 0.72, reason: 'Yönetim ve politika alanları demo beyanı üzerinden gösterilir.', evidence: [] },
    },
  },
  declaration: {
    employeeCount: 286,
    weeklyWorkHours: 45,
    extraExcuseLeave: 5,
    remoteWork: 'partial',
    vehiclesCount: { electric: 2, hybrid: 4, diesel: 8, gasoline: 3 },
    hasEmsPolicy: 'yes',
    zeroWasteLevel: 'advanced',
    hasRenewableEnergy: true,
    annualElectricity: 1842000,
    annualWater: 68400,
    confirmed: true,
  },
  activityText: 'Yeşil Tekstil A.Ş., Bursa tesisinde yıllık yaklaşık 3,8 milyon metre dokuma ve örme kumaş üretmektedir. 2025 döneminde 1.842.000 kWh şebeke elektriği, 246.000 m³ doğalgaz ve 68.400 m³ su tüketilmiştir. Çatı GES sistemi 312.000 kWh elektrik üretmiş; toplam suyun %31’i proses içinde yeniden kullanılmıştır. Boyama ve apre süreçlerinde 1.180 ton pamuk, 620 ton geri dönüştürülmüş polyester ve 340 ton diğer elyaf kullanılmıştır. Şirketin 286 çalışanı vardır; çalışanların %42’si kadın, yönetim ekibinin %38’i kadındır. Atıkların %76’sı geri kazanım veya yeniden kullanım için ayrıştırılmıştır. Kapsam 1 emisyonları 512 tCO2e, Kapsam 2 emisyonları 846 tCO2e, tahmini Kapsam 3 emisyonları 3.240 tCO2e’dir. Veriler jüri demosu için sentetik örnek veridir.',
  suggestedInvestments: {
    ges_budget: 1200000,
    ev_count: 2,
    eff_budget: 650000,
    waste_budget: 280000,
    water_budget: 420000,
  },
  sourceDocuments: [
    { id: 'sgk', docType: 'sgk', title: 'SGK Hizmet Dökümü', fileName: 'YESTK_SGK_2025_ornek.pdf', size: '1,8 MB', detail: '286 çalışan · 2025 yıl sonu' },
    { id: 'declaration', docType: null, title: 'Yönetici Beyan Formu', fileName: 'YESTK_yonetici_beyani_2025.json', size: '42 KB', detail: 'TSRS 1 ve TSRS 2 alanları tamamlandı' },
    { id: 'sanayi_sicil', docType: 'sanayi_sicil', title: 'Sanayi Sicil Belgesi', fileName: 'YESTK_sanayi_sicil_2025.pdf', size: '940 KB', detail: 'NACE 13.20 · geçerlilik 2027' },
    { id: 'kapasite_raporu', docType: 'kapasite_raporu', title: 'Kapasite Raporu', fileName: 'YESTK_kapasite_raporu_2025.pdf', size: '1,2 MB', detail: 'Yıllık 3,8 milyon metre kumaş' },
    { id: 'ekb', docType: 'ekb', title: 'Enerji Kimlik Belgesi', fileName: 'YESTK_EKB_2025.pdf', size: '760 KB', detail: 'B sınıfı · Bursa üretim tesisi' },
    { id: 'iso_14001', docType: 'iso_14001', title: 'ISO 14001 Belgesi', fileName: 'YESTK_ISO14001_2025.pdf', size: '1,1 MB', detail: 'Gözetim denetimi: Kasım 2025' },
    { id: 'efatura', docType: 'efatura', title: 'Enerji Faturaları', fileName: 'YESTK_enerji_faturalari_2025.zip', size: '4,6 MB', detail: '12 aylık elektrik ve doğalgaz faturası' },
    { id: 'mizan', docType: 'mizan', title: 'Mizan ve Finansal Özet', fileName: 'YESTK_mizan_2025.xlsx', size: '312 KB', detail: '2025 kapanış mizanı · örnek veri' },
    { id: 'motat', docType: 'motat', title: 'Atık ve Su Beyanı', fileName: 'YESTK_atik_su_beyani_2025.pdf', size: '580 KB', detail: 'Atık geri kazanım oranı: %76' },
    { id: 'osgb', docType: 'osgb', title: 'İSG ve OSGB Raporu', fileName: 'YESTK_OSGB_2025.pdf', size: '690 KB', detail: 'Kaza sıklık oranı: 1,8' },
    { id: 'activity', docType: 'activity', title: 'Şirket Faaliyet Raporu', fileName: 'YESTK_faaliyet_raporu_2025.pdf', size: '2,4 MB', detail: 'Üretim, çalışan ve iklim açıklamaları' },
  ],
  reportMarkdown: `# Yeşil Tekstil A.Ş. — Sürdürülebilirlik Beyanı\n\n> **Jüri demosu için sentetik örnektir.** Gerçek şirket verisi, bağımsız güvence veya resmî TSRS bildirimi değildir.\n\n## Raporlama dönemi ve kapsam\nBu örnek beyan 1 Ocak–31 Aralık 2025 dönemini kapsar. Yeşil Tekstil A.Ş.'nin Bursa'daki dokuma, örme, boyama ve apre faaliyetleri değerlendirilmiştir. Bilgiler demo amacıyla oluşturulmuş sentetik şirket verilerinden derlenmiştir.\n\n## İş modeli ve değer zinciri\nŞirket, yıllık yaklaşık 3,8 milyon metre kumaş üretir. Başlıca girdiler pamuk, geri dönüştürülmüş polyester, diğer elyaflar, elektrik, doğalgaz ve sudur. Yukarı akışta elyaf tedariki; kendi faaliyetlerinde iplik, dokuma, boyama ve apre; aşağı akışta konfeksiyon müşterilerine satış ve lojistik yer alır.\n\n## Yönetişim\nYönetim kurulu sürdürülebilirlik hedeflerini yılda en az iki kez gözden geçirir. Çevre ve İSG göstergeleri sürdürülebilirlik yöneticisi tarafından aylık izlenir; önemli sapmalar operasyon yönetimine raporlanır. Bu anlatım demo için hazırlanmış varsayımsal süreç bilgisidir.\n\n## Strateji ve iklim\nEnerji maliyetleri, suya erişim, karbon düzenlemeleri ve elyaf tedarikindeki dönüşüm şirket için öncelikli risk ve fırsatlardır. Çatı GES, enerji verimliliği, proses suyunun geri kullanımı ve geri dönüştürülmüş elyaf kullanımının artırılması planlanan dönüşüm başlıklarıdır.\n\n## Risk yönetimi\nİklim ve sürdürülebilirlik riskleri; etki, olasılık, zaman ufku ve değer zinciri bağlantısı dikkate alınarak önceliklendirilir. Su stresi ve enerji arzı kısa/orta vadede, düşük karbonlu ürün talebi ise orta/uzun vadede izlenecek örnek konulardır.\n\n## Metrikler ve hedefler\n- Elektrik tüketimi: **1.842.000 kWh**; doğalgaz tüketimi: **246.000 m³**.\n- Su çekimi: **68.400 m³**; proses suyunun yeniden kullanım oranı: **%31**.\n- Kapsam 1: **512 tCO₂e**; Kapsam 2: **846 tCO₂e**; tahmini Kapsam 3: **3.240 tCO₂e**.\n- Geri kazanım veya yeniden kullanım için ayrıştırılan atık oranı: **%76**.\n- Çalışan sayısı: **286**; kadın çalışan oranı: **%42**; kaza sıklık oranı: **1,8**.\n\n## Veri sınırları ve güvence\nGöstergeler örnek kaynak dosyalarla eşleştirilmiş sentetik demo değerleridir. Kapsam 3 tahmini, gerçek tedarikçi verisiyle doğrulanmamıştır. Bu belge yayımlanmış şirket raporu, denetim görüşü veya bağımsız güvence beyanı olarak kullanılamaz.`,
};

export const createEmptyGreenTextileDemoState = () => ({
  loaded: false,
  documentsImported: false,
  documents: {},
  uploads: [],
  declaration: null,
  completedAt: null,
});

export const getGreenTextileDemoState = () => {
  if (typeof window === 'undefined') return createEmptyGreenTextileDemoState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyGreenTextileDemoState();
    const parsed = JSON.parse(saved);
    return {
      ...createEmptyGreenTextileDemoState(),
      ...parsed,
      documentsImported: parsed.documentsImported ?? parsed.loaded ?? false,
    };
  } catch {
    return createEmptyGreenTextileDemoState();
  }
};

export const saveGreenTextileDemoState = (state) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const isGreenTextileUser = (user) => user?.companyTicker?.toUpperCase() === GREEN_TEXTILE_TICKER;

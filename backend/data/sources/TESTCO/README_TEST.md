# TESTCO TSRS test veri paketi

> SENTETİK TEST VERİSİ — Gerçek bir şirkete, kişiye veya belgeye ait değildir.

Bu klasör, mevcut TSRS pipeline'ının veri entegrasyonunu ve kaynak sadakatini test etmek için hazırlanmıştır. Şirket adı, belge numaraları ve bütün tutarlar kurgusaldır. Resmî raporlama veya güvence amacıyla kullanılamaz.

## Test kimliği

- Ticker: `TESTCO`
- Şirket: EkoTest Metal Teknolojileri A.Ş.
- Dönem: 01.01.2025–31.12.2025
- Raporlama sınırı: Ankara OSB'deki tek üretim tesisi
- Para birimi: TL

## Beklenen temel sonuçlar

| Gösterge | Beklenen değer |
|---|---:|
| Çalışan | 48 |
| Kadın / erkek | 18 / 30 |
| Üretim | 750.000 adet |
| Elektrik | 360.000 kWh |
| Doğal gaz | 48.000 Sm³ |
| Dizel / benzin | 12.000 / 3.000 litre |
| Su çekimi | 2.400 m³ |
| Toplam atık | 20 ton |
| Geri kazanılan atık | 15 ton |
| Atık geri kazanım oranı | %75 |
| Kapsam 1 | 136,05 tCO2e |
| Kapsam 2 (konum bazlı) | 180,00 tCO2e |
| Kapsam 1+2 | 316,05 tCO2e |
| Net satışlar | 150.000.000 TL |
| Emisyon yoğunluğu | 2,107 tCO2e / milyon TL net satış |

Emisyonlar sadece bu test için sabitlenen faktörlerle hesaplanır:

- Doğal gaz: 2,02 kgCO2e/Sm³
- Dizel: 2,68 kgCO2e/litre
- Benzin: 2,31 kgCO2e/litre
- Satın alınan elektrik: 0,50 kgCO2e/kWh

Formüller:

- Kapsam 1 = `(48.000 × 2,02 + 12.000 × 2,68 + 3.000 × 2,31) / 1.000 = 136,05 tCO2e`
- Kapsam 2 = `360.000 × 0,50 / 1.000 = 180,00 tCO2e`
- Toplam = `316,05 tCO2e`

## Başarı ölçütü

Üretilen rapor en azından yukarıdaki gerçek değerleri taşımalı, kaynaklarda olmayan kurumsal sistem veya güvence iddiaları üretmemeli ve eksik olan piyasa bazlı Kapsam 2 ile Kapsam 3 verisini “hesaplanamadı” olarak açıklamalıdır.

Şu ifadeler fixture'a ait değildir ve raporda görülürse kaynak sadakati testi başarısızdır: `55 aktif personel`, `14.500 kWh`, `15,42 tCO2e`, `SAP ERP`, `Green Ledger`, `blockchain ile doğrulandı`.

## Çalıştırma

Backend klasöründe:

```powershell
python scripts/validate_tsrs_testco.py
python -c "from pathlib import Path; from config import get_company_sources_dir, get_company_report_path; from modules.tsrs.pipeline import run_tsrs_pipeline; print(run_tsrs_pipeline(get_company_sources_dir('TESTCO'), get_company_report_path('TESTCO')))"
python scripts/validate_tsrs_testco.py --report output/TESTCO/TSRS_Uyumlu_Surdurulebilirlik_Raporu.md
```

İlk komut veri paketini, son komut oluşturulan raporun kaynak sadakatini denetler.

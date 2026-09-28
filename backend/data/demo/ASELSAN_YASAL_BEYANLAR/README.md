# ASELSAN portalı için Yasal Beyanlar demo paketi

> **DEMO / SENTETİK VERİ:** Bu paketteki hiçbir sayı, belge numarası, tesis, sertifika, izin, imza veya beyan gerçek ASELSAN verisi değildir. Belgeler yalnızca EkoFin arayüzünü ve TSRS veri akışını göstermek için kurgulanmıştır. Resmî başvuru, raporlama, denetim veya güvence amacıyla kullanılamaz.

## Demo senaryosu

- Gösterim dönemi: 01.01.2025–31.12.2025
- Kuruluş etiketi: ASELSAN (temsili demo profili)
- Tesis etiketi: `DEMO-ANK-01` (gerçek adres değildir)
- Para birimi: TL
- Kişisel veri: Yok; çalışan verileri toplu ve kurgusaldır.

## Ekrandaki bölümler ve karşılık gelen örnekler

| Yasal Beyanlar bölümü | Demo dosyası | Ekrandaki tür |
|---|---|---|
| SGK Hizmet Dökümleri | `sgk_listesi.md` | SGK özeti |
| Yönetici Beyan Formu | `yonetici_anketi.json` | Formu uygulamada doldurma/onaylama örneği |
| Sanayi Sicil Belgesi | `sanayi_sicil.json` | Sanayi sicil özeti |
| Kapasite Raporu (TOBB) | `kapasite_raporu.json` | Kapasite özeti |
| Enerji Kimlik Belgesi (EKB) | `ekb.md` | EKB özeti |
| ISO 14001 Çevre YYS | `iso_14001.json` | Sertifika alanları örneği |
| Mizan (Muhasebe Bilançosu) | `mizan.md` | Hesap özeti |
| MOTAT Atık ve Su Beyanı | `motat-atik-ve-su-beyani.md` | Atık ve su özeti |
| OSGB Raporu | `osgb-raporu.md` | İSG özeti |
| Taşıt Tanıma Sistemi Kaydı | `tasit-tanima-sistemi.md` | Filo/yakıt özeti |
| Şirket Faaliyet Raporu | `şirket-faliyet-raporu.md` | Faaliyet özeti |

TSRS rapor üretiminde ayrıca kritik kaynak olarak kullanılan enerji ve su faturası özeti `faturalar.md` dosyasında bulunur. Bu dosya Yasal Beyanlar kartlarından ayrı bir TSRS girdisidir.

## Kullanım

1. Arayüzde **Veri Entegrasyonu → Yasal Beyanlar** bölümünü aç.
2. Dosya yükleme alanı olan kartlarda aynı adlı demo dosyasını seç.
3. Yönetici beyanı bir dosya yüklemesi değildir; sentetik değerleri yönetici beyan formuna elle aktar ve demo olduğunu belirterek göster.
4. Demo paketini `backend/data/sources/ASELS/` içine kopyalama. Böylece var olan ASELS kaynakları, rapor girdileri ve yükleme durumları etkilenmez.

JSON dosyalarındaki `DEMO-VOID` numaraları bilerek geçersiz örnek değerlerdir. İmzacı, T.C. kimlik numarası, araç plakası, gerçek sicil/sertifika numarası veya gerçek belge görseli içermez.


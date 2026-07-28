"""
NLP Geri Bildirim Analiz Modülü — ESG Etki Hesaplayıcı
Yorumların duygu durumunu ve hangi ESG sütununu (E, S, G) etkilediğini OpenAI ile analiz eder.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class ESGAnalysisResult(BaseModel):
    sentiment: str = Field(description="Yorumun genel duygu durumu: 'Pozitif', 'Nötr' veya 'Negatif'")
    pillar: str = Field(description="Etkilenen ESG sütunu: 'Environmental', 'Social' veya 'Governance'")
    impact_score: float = Field(description="ESG skoruna etkisi (-1.5 ile +1.5 arasında bir reel sayı)")
    explanation: str = Field(description="Yorumun bu ESG sütununa etkisinin Türkçe kısa açıklaması")

class ESGBatchAnalysisResult(BaseModel):
    results: List[ESGAnalysisResult] = Field(description="Girdi listesiyle birebir aynı sırada ve sayıda analiz sonucu")

PROMPT_TEMPLATE = (
    "Aşağıdaki şirket yorumunu analiz et ve ESG (Çevresel, Sosyal, Yönetişim) etki raporunu çıkar.\n"
    "Analiz sonucunu mutlaka şu JSON formatında döndür:\n"
    "{format_instructions}\n\n"
    "Yorum: \"{comment}\"\n\n"
    "Kurallar:\n"
    "1. impact_score değeri: Çok olumsuz durumlar için -1.5, olumsuz durumlar için -0.8 ile -0.2 arası, "
    "nötr için 0.0, olumlu durumlar için +0.2 ile +0.8 arası, çok büyük yeşil yatırımlar/başarılar için +1.5 olmalıdır.\n"
    "2. pillar alanını yorumun içeriğine göre 'Environmental' (karbon salınımı, atık, enerji, doğa), "
    "'Social' (çalışan hakları, sendika, iş güvenliği, müşteri/toplum ilişkileri) veya "
    "'Governance' (yolsuzluk, şeffaflık, yönetim kurulu, vergi, etik dışı davranış) olarak seç.\n"
    "3. explanation alanında yorumun neden bu sütunu etkilediğini Türkçe olarak 1-2 cümlede açıkla."
)

BATCH_PROMPT_TEMPLATE = (
    "Aşağıda numaralandırılmış {count} adet şirket haberi/yorumu var. HER BİRİNİ AYRI AYRI analiz ederek "
    "ESG (Çevresel, Sosyal, Yönetişim) etki raporu çıkar.\n"
    "Sonucu mutlaka şu JSON formatında döndür (results listesi GİRDİ SAYISIYLA AYNI UZUNLUKTA ve AYNI SIRADA olmalı):\n"
    "{format_instructions}\n\n"
    "Metinler:\n{numbered_comments}\n\n"
    "Kurallar:\n"
    "1. impact_score değeri: Çok olumsuz durumlar için -1.5, olumsuz durumlar için -0.8 ile -0.2 arası, "
    "nötr/alakasız (rutin finansal açıklama, temettü, bilanço vb. ESG ile doğrudan ilgisi olmayan) için 0.0, "
    "olumlu durumlar için +0.2 ile +0.8 arası, çok büyük yeşil yatırımlar/başarılar için +1.5 olmalıdır.\n"
    "2. pillar alanını içeriğe göre 'Environmental' (karbon salınımı, atık, enerji, doğa), "
    "'Social' (çalışan hakları, sendika, iş güvenliği, müşteri/toplum ilişkileri) veya "
    "'Governance' (yolsuzluk, şeffaflık, yönetim kurulu, vergi, etik dışı davranış, sözleşme/ihale kararları) olarak seç.\n"
    "3. explanation alanında metnin neden bu sütunu etkilediğini (veya etkilemediğini) Türkçe 1 cümlede açıkla.\n"
    "4. results listesindeki N'inci eleman, girdideki N'inci metne karşılık gelmelidir — sırayı bozma."
)

class ESGCommentAnalyzer:
    """Yorumları analiz ederek ESG skoru etki değerini üreten NLP sınıfı.

    Sağlayıcı zinciri: OpenAI (gpt-4o-mini) -> Gemini (gemini-2.5-flash) -> kural tabanlı fallback.
    İlk sağlayıcı anahtarsız/hatalıysa bir sonrakine düşülür; hiçbiri çalışmazsa
    anahtar kelime tabanlı yerel analiz kullanılır.
    """

    def __init__(self):
        self.parser = JsonOutputParser(pydantic_object=ESGAnalysisResult)
        self.prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        self.batch_parser = JsonOutputParser(pydantic_object=ESGBatchAnalysisResult)
        self.batch_prompt = ChatPromptTemplate.from_template(BATCH_PROMPT_TEMPLATE)

        openai_model = self._build_openai_model()
        gemini_model = self._build_gemini_model()

        self.openai_chain = (self.prompt | openai_model | self.parser) if openai_model else None
        self.gemini_chain = (self.prompt | gemini_model | self.parser) if gemini_model else None
        self.openai_batch_chain = (self.batch_prompt | openai_model | self.batch_parser) if openai_model else None
        self.gemini_batch_chain = (self.batch_prompt | gemini_model | self.batch_parser) if gemini_model else None

    def _build_openai_model(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        try:
            from langchain_openai import ChatOpenAI
            # max_retries=0: geçersiz anahtar gibi kalıcı hatalarda tekrar tekrar
            # denemeyip hızlıca Gemini'ye düşülsün diye (varsayılan retry, 401'de bile
            # onlarca saniye harcatıyordu).
            return ChatOpenAI(model="gpt-4o-mini", temperature=0.0, openai_api_key=api_key,
                               max_retries=0, timeout=25)
        except Exception as e:
            print(f"[!] NLP Analizör ChatOpenAI başlatılamadı: {e}")
            return None

    def _build_gemini_model(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0, api_key=api_key,
                                           max_retries=0, timeout=25)
        except Exception as e:
            print(f"[!] NLP Analizör Gemini başlatılamadı: {e}")
            return None

    def _validate(self, result: dict) -> dict:
        result["impact_score"] = max(-1.5, min(1.5, float(result.get("impact_score", 0.0))))
        if result.get("pillar") not in ["Environmental", "Social", "Governance"]:
            result["pillar"] = "Environmental"
        if result.get("sentiment") not in ["Pozitif", "Nötr", "Negatif"]:
            result["sentiment"] = "Nötr"
        return result

    def _try_chain(self, chain, comment: str) -> Optional[dict]:
        if chain is None:
            return None
        try:
            result = chain.invoke({
                "comment": comment,
                "format_instructions": self.parser.get_format_instructions()
            })
            return self._validate(result)
        except Exception as e:
            print(f"[!] LLM analizi başarısız oldu: {e}")
            return None

    def analyze(self, comment: str) -> Dict[str, Any]:
        """Yorumu analiz eder ve analiz sonucunu döner."""
        if not comment or not comment.strip():
            return {
                "sentiment": "Nötr",
                "pillar": "Environmental",
                "impact_score": 0.0,
                "explanation": "Yorum boş veya geçersiz."
            }

        # Circuit breaker: bir sağlayıcı bir kez kalıcı hatayla (örn. geçersiz anahtar)
        # başarısız olduysa süreç ömrü boyunca tekrar denenmez — her çağrıda saniyeler
        # süren gereksiz retry/timeout maliyetine girilmez.
        if self.openai_chain is not None and not getattr(self, "_openai_broken", False):
            result = self._try_chain(self.openai_chain, comment)
            if result is not None:
                return result
            self._openai_broken = True
            print("[!] OpenAI bu oturumda devre dışı bırakıldı (kalıcı hata).")

        if self.gemini_chain is not None and not getattr(self, "_gemini_broken", False):
            result = self._try_chain(self.gemini_chain, comment)
            if result is not None:
                return result
            self._gemini_broken = True
            print("[!] Gemini de bu oturumda devre dışı bırakıldı (kalıcı hata).")

        print("[!] Hiçbir LLM sağlayıcısı çalışmadı. Kural tabanlı fallback çalıştırılıyor...")
        return self._fallback_analyze(comment)

    def analyze_batch(self, comments: List[str]) -> List[Dict[str, Any]]:
        """Birden fazla metni (örn. haber başlıkları) TEK bir LLM çağrısında analiz eder.
        Kota/maliyet tüketimini len(comments) yerine 1 çağrıya indirir. Sonuç sayısı
        girdiyle uyuşmazsa (LLM bazen eleman atlar) o batch fallback'e düşer."""
        if not comments:
            return []

        numbered = "\n".join(f"{i+1}. \"{c}\"" for i, c in enumerate(comments))
        payload = {
            "numbered_comments": numbered,
            "count": len(comments),
            "format_instructions": self.batch_parser.get_format_instructions()
        }

        if self.openai_batch_chain is not None and not getattr(self, "_openai_broken", False):
            result = self._try_batch_chain(self.openai_batch_chain, payload, len(comments))
            if result is not None:
                return result
            self._openai_broken = True
            print("[!] OpenAI bu oturumda devre dışı bırakıldı (kalıcı hata).")

        if self.gemini_batch_chain is not None and not getattr(self, "_gemini_broken", False):
            result = self._try_batch_chain(self.gemini_batch_chain, payload, len(comments))
            if result is not None:
                return result
            self._gemini_broken = True
            print("[!] Gemini de bu oturumda devre dışı bırakıldı (kalıcı hata).")

        print(f"[!] Hiçbir LLM sağlayıcısı çalışmadı. {len(comments)} öğe kural tabanlı fallback ile analiz ediliyor...")
        return [self._fallback_analyze(c) for c in comments]

    def _try_batch_chain(self, chain, payload: dict, expected_len: int) -> Optional[List[dict]]:
        try:
            raw = chain.invoke(payload)
            items = raw.get("results", []) if isinstance(raw, dict) else []
            if len(items) != expected_len:
                print(f"[!] Batch analiz sonuç sayısı uyuşmadı (beklenen {expected_len}, gelen {len(items)}).")
                return None
            return [self._validate(dict(item)) for item in items]
        except Exception as e:
            print(f"[!] Batch LLM analizi başarısız oldu: {e}")
            return None

    def _normalize(self, text: str) -> str:
        """Türkçe karakterleri İngilizce karşılıklarına dönüştürür ve küçük harfe çevirir."""
        translation_table = str.maketrans({
            'ı': 'i', 'ş': 's', 'ğ': 'g', 'ç': 'c', 'ö': 'o', 'ü': 'u',
            'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ç': 'c', 'Ö': 'o', 'Ü': 'u'
        })
        return text.translate(translation_table).lower()

    def _fallback_analyze(self, comment: str) -> Dict[str, Any]:
        """OpenAI erişimi olmadığında veya hata alındığında çalışacak akıllı kural tabanlı analizör."""
        c_norm = self._normalize(comment)

        # İngilizce karakter normalize edilmiş anahtar kelime eşlemeleri
        env_keywords = [
            "karbon", "atik", "cevre", "yesil", "enerji", "ges", "doga", "hava", 
            "su", "kirlilik", "emisyon", "filtre", "baca", "kuresel isinma", 
            "iklim", "cop", "aritma", "geri donusum", "plastik", "kimyasal", "dokuldu"
        ]
        gov_keywords = [
            "etik", "yolsuzluk", "yonetim", "seffaf", "hissedar", "vergi", "rusvet", 
            "hile", "yalan", "beyan", "denetim", "rapor", "kurul", "ceza", "mahkeme",
            "yolsuz", "hakim", "haksiz", "manipule"
        ]
        soc_keywords = [
            "calisan", "isci", "sendika", "grev", "toplum", "halk", "musteri", 
            "guvenlik", "kaza", "maas", "mobbing", "engelsiz", "saglik", "insan hak",
            "sakat", "yaralan", "olum", "tazminat", "sigorta", "sendika"
        ]

        # Pillar tespiti
        env_score = sum(1 for w in env_keywords if w in c_norm)
        gov_score = sum(1 for w in gov_keywords if w in c_norm)
        soc_score = sum(1 for w in soc_keywords if w in c_norm)

        if gov_score > env_score and gov_score > soc_score:
            pillar = "Governance"
        elif soc_score > env_score and soc_score > gov_score:
            pillar = "Social"
        else:
            pillar = "Environmental"

        # Sentiment & Duygu kelimeleri
        neg_words = [
            "kotu", "rezalet", "sikayet", "zarar", "yalan", "hata", "berbat", 
            "ihlal", "kaza", "risk", "olumsuz", "zehir", "sizinti", "kirli", 
            "ceza", "grev", "mobbing", "dokuldu", "atik", "kirlet", "rusvet",
            "berbat", "tazminat", "kaza", "hasar", "eksik", "zayif"
        ]
        pos_words = [
            "iyi", "harika", "basarili", "tebrik", "takdir", "oncu", "guzel", 
            "temiz", "verimli", "destek", "odul", "katki", "inovasyon", 
            "engelsiz", "tasarruf", "seffaf", "ilerleme", "gelisme", "memnun"
        ]

        neg_score = sum(1 for w in neg_words if w in c_norm)
        pos_score = sum(1 for w in pos_words if w in c_norm)

        # Cümle içi duygu katsayıları
        if neg_score > pos_score:
            sentiment = "Negatif"
            # Negatiflik derecesine göre etki puanı
            impact_score = -0.5 if neg_score == 1 else -1.2
            explanation = f"Toplumsal denetimde tespit edilen olumsuz ifadeler nedeniyle {pillar} risk skoru artırıldı."
        elif pos_score > neg_score:
            sentiment = "Pozitif"
            impact_score = 0.4 if pos_score == 1 else 1.0
            explanation = f"Şirket hakkında yapılan olumlu geri bildirimler {pillar} alanındaki güveni güçlendiriyor."
        else:
            sentiment = "Nötr"
            impact_score = 0.0
            explanation = f"Yapılan yorum tarafsız veya dengeli bir tona sahip olduğundan {pillar} skoruna etki etmedi."

        return {
            "sentiment": sentiment,
            "pillar": pillar,
            "impact_score": impact_score,
            "explanation": explanation
        }

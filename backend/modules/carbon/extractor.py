"""
Carbon Modülü — Aktivite Çıkarıcı (Extractor)
Metin girdisinden karbon emisyon aktivitelerini yapılandırılmış şekilde çıkarır.
Gemini API varsa LLM kullanır, yoksa mock parser'a düşer.

Taşındı: model_c/model.py → modules/carbon/extractor.py
"""

import os
import sys
from pydantic import BaseModel, Field
from typing import List

# Pydantic models for structured output from LLM
class ExtractedActivity(BaseModel):
    category: str = Field(description="Faaliyet kategorisi: 'hammadde', 'lojistik' veya 'enerji'")
    item_type: str = Field(description="Öğe türü. Örn: 'pamuk', 'dizel_kamyon', 'elektrik_sebeke', 'dogalgaz'")
    amount: float = Field(description="Aktivite miktarı. Sayısal değer.")
    unit: str = Field(description="Aktivite birimi. Örn: 'ton', 'km', 'kWh', 'm3', 'kg'")

class CarbonExtractionModel(BaseModel):
    company_activities: List[ExtractedActivity] = Field(description="Metinden çıkarılan tüm karbon salınımına yol açan emisyon aktivitelerinin listesi")

# Modül seviyesinde mock parser — hem GEMINI_API_KEY yoksa hem de LLM çağrısı
# başarısız/zaman aşımına uğrarsa (bkz. api.py: _extract_activities_isolated)
# dışarıdan da çağrılabilsin diye burada tanımlı.
def _mock_parser(txt: str) -> CarbonExtractionModel:
    activities = []
    lower_text = txt.lower()

    if "pamuk" in lower_text:
        activities.append(ExtractedActivity(category="hammadde", item_type="pamuk", amount=10.0, unit="ton"))
    if "kamyon" in lower_text or "lojistik" in lower_text:
        activities.append(ExtractedActivity(category="lojistik", item_type="dizel_kamyon", amount=3000.0, unit="km"))
    if "elektrik" in lower_text:
        activities.append(ExtractedActivity(category="enerji", item_type="elektrik_sebeke", amount=20000.0, unit="kWh"))
    if "doğalgaz" in lower_text or "dogalgaz" in lower_text:
        activities.append(ExtractedActivity(category="enerji", item_type="dogalgaz", amount=1500.0, unit="m3"))
    if "plastik" in lower_text:
        activities.append(ExtractedActivity(category="hammadde", item_type="plastik_polimer", amount=5.0, unit="ton"))

    if not activities:
        # Basic default fallback if text is completely arbitrary
        activities.append(ExtractedActivity(category="hammadde", item_type="pamuk", amount=1.0, unit="ton"))

    return CarbonExtractionModel(company_activities=activities)


# Gemini API Extractor logic with non-recursive fallback mock mode
def extract_activities(text: str) -> CarbonExtractionModel:
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gemini_key:
        print("[Sistem] GEMINI_API_KEY bulunamadı. Otonom MOCK modunda veri ayıklanıyor...", file=sys.stderr)
        return _mock_parser(text)

    # 2. LangChain Expression Language (LCEL) structured output
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.prompts import ChatPromptTemplate

        # timeout/max_retries olmadan Gemini API bir sorun yaşadığında (rate limit,
        # ağ hıçkırığı, uzun belge içeriği) istek süresiz askıda kalıp tüm backend
        # thread havuzunu tıkayabiliyordu — sınırlı süre sonra mock_parser'a düşüyoruz.
        model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=gemini_key, timeout=20, max_retries=1)
        structured_model = model.with_structured_output(CarbonExtractionModel)

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "Sen kapasite raporlarından karbon faaliyet verilerini ve ham maddeleri ayıklayan uzman bir ESG denetçisisin. "
                "Metin içindeki hammaddeleri (pamuk, plastik vb.), lojistiği (kamyon km vb.) ve enerji girdilerini (elektrik, doğalgaz vb.) tam eşleşen kategorileriyle çıkar. "
                "Eğer metinde hiçbir emisyon faaliyeti yoksa boş bir liste döndür."
            )),
            ("human", "Aşağıdaki metinden karbon emisyonu üreten faaliyetleri çıkar:\n\n{text}")
        ])

        chain = prompt | structured_model
        result = chain.invoke({"text": text})
        return result
        
    except Exception as e:
        print(f"[Hata] LCEL Gemini zinciri çalışırken hata oluştu: {e}", file=sys.stderr)
        return _mock_parser(text)

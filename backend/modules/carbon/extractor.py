"""
Carbon Modülü — Aktivite Çıkarıcı (Extractor)
Metin girdisinden karbon emisyon aktivitelerini yapılandırılmış şekilde çıkarır.
Gemini API varsa LLM kullanır, yoksa mock parser'a düşer.

Taşındı: model_c/model.py → modules/carbon/extractor.py
"""

import os
import sys
import time
from typing import List
from pydantic import BaseModel, Field
from logger import logger, log_llm_request, log_llm_response, log_llm_fallback

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
        log_llm_fallback(task="Karbon Faaliyet Çıkarımı", original_provider="Gemini", fallback_to="Kural Tabanlı Mock Parser", reason="GEMINI_API_KEY yapılandırılmamış")
        return _mock_parser(text)

    # 2. LangChain Expression Language (LCEL) structured output
    # Kaynak: https://ai.google.dev/gemini-api/docs/openai?hl=tr
    base_url = os.getenv("GEMINI_API_BASE") or "https://generativelanguage.googleapis.com/v1beta/openai/"
    model_name = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
    log_llm_request(provider="Gemini", model=model_name, task="Karbon Faaliyet Çıkarımı", prompt_preview=text)
    t0 = time.perf_counter()
    
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate

        model = ChatOpenAI(model=model_name, openai_api_key=gemini_key, base_url=base_url, timeout=20, max_retries=1)
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
        res = chain.invoke({"text": text})
        elapsed_ms = (time.perf_counter() - t0) * 1000
        log_llm_response(provider="Gemini (OpenAI Endpoint)", model=model_name, task="Karbon Faaliyet Çıkarımı", elapsed_ms=elapsed_ms, success=True, details=f"{len(res.company_activities)} faaliyet çıkarıldı")
        return res

    except Exception as e_openai:
        log_llm_fallback(task="Karbon Faaliyet Çıkarımı", original_provider="Gemini (OpenAI Endpoint)", fallback_to="Google GenAI SDK", reason=str(e_openai))
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.prompts import ChatPromptTemplate

            model = ChatGoogleGenerativeAI(model=model_name, api_key=gemini_key, timeout=20, max_retries=1)
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
            res = chain.invoke({"text": text})
            elapsed_ms = (time.perf_counter() - t0) * 1000
            log_llm_response(provider="Gemini (GenAI SDK)", model=model_name, task="Karbon Faaliyet Çıkarımı", elapsed_ms=elapsed_ms, success=True, details=f"{len(res.company_activities)} faaliyet çıkarıldı")
            return res
        except Exception as e_genai:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            log_llm_response(provider="Gemini", model=model_name, task="Karbon Faaliyet Çıkarımı", elapsed_ms=elapsed_ms, success=False, details=f"{e_openai} / {e_genai}")
            log_llm_fallback(task="Karbon Faaliyet Çıkarımı", original_provider="Gemini", fallback_to="Kural Tabanlı Mock Parser", reason=f"{e_openai} / {e_genai}")
            return _mock_parser(text)

"""
Model C — Green Finance ROI Motoru
====================================
Model C karbon çıktısını alır ve 5 bileşenli G-ROI hesabı üretir.
Tüm katsayılar denetlenebilir referanslarla belgelenmiştir.
"""

import os
import io
import sys
import time
import json
from pydantic import BaseModel, Field
from typing import List, Optional
from logger import logger, log_llm_request, log_llm_response, log_llm_fallback

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

class CodeGenerationStep(BaseModel):
    thought_process: str = Field(description="Hesaplama adımlarını planlayan düşünce zinciri")
    python_code: str = Field(description="Hesaplamayı yapacak çalıştırılabilir Python kodu. Sadece kod, backtick olmadan.")

def _run_langchain_cot_pipeline(params_text: str, target_schema, system_instruction: str):
    # Kaynak: https://ai.google.dev/gemini-api/docs/openai?hl=tr
    api_key = os.getenv("GEMINI_API_KEY")
    base_url = os.getenv("GEMINI_API_BASE") or "https://generativelanguage.googleapis.com/v1beta/openai/"
    model_name = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
    try:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model=model_name, openai_api_key=api_key, base_url=base_url, temperature=0.0, timeout=15, max_retries=1)
    except Exception:
        llm = ChatGoogleGenerativeAI(model=model_name, api_key=api_key, temperature=0.0, timeout=15, max_retries=1)
    
    code_chain = (
        ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "Parametreler:\n{params}")
        ]) 
        | llm.with_structured_output(CodeGenerationStep)
    )
    
    final_chain = (
        ChatPromptTemplate.from_messages([
            ("system", "Sen bir sentezleyici uzmansın. Girdi ve kod çıktılarına bakarak istenen yapıda (JSON formatında) veriyi eksiksiz olarak döndür. Sayısal verilere dikkat et."),
            ("human", "Girdi:\n{params}\n\nDüşünce Zinciri:\n{thought}\n\nKod Çıktısı:\n{output}")
        ])
        | llm.with_structured_output(target_schema)
    )

    log_llm_request(provider="Gemini", model=model_name, task="G-ROI CoT Adım 1 (Kod Üretimi)", prompt_preview=params_text)
    t0 = time.perf_counter()
    step1_res = code_chain.invoke({"params": params_text})
    elapsed_step1 = (time.perf_counter() - t0) * 1000
    log_llm_response(provider="Gemini", model=model_name, task="G-ROI CoT Adım 1", elapsed_ms=elapsed_step1, success=True)

    code = step1_res.python_code
    
    if code.strip().startswith("```"):
        lines = code.strip().split("\n")
        if lines[0].startswith("```"): lines = lines[1:]
        if lines[-1].startswith("```"): lines = lines[:-1]
        code = "\n".join(lines)
        
    old_stdout = sys.stdout
    sys.stdout = new_stdout = io.StringIO()
    exec_error = ""
    try:
        exec(code, {})
    except Exception as e:
        exec_error = str(e)
    finally:
        sys.stdout = old_stdout
        
    exec_output = new_stdout.getvalue()
    if exec_error:
        exec_output += f"\nError: {exec_error}"
        logger.warning(f"⚠️ [G-ROI] Üretilen Python kodu çalışırken hata: {exec_error}")
        
    log_llm_request(provider="Gemini", model=model_name, task="G-ROI CoT Adım 2 (Sentez)", prompt_preview=exec_output)
    t1 = time.perf_counter()
    final_res = final_chain.invoke({
        "params": params_text,
        "thought": step1_res.thought_process,
        "output": exec_output
    })
    elapsed_step2 = (time.perf_counter() - t1) * 1000
    log_llm_response(provider="Gemini", model=model_name, task="G-ROI CoT Adım 2", elapsed_ms=elapsed_step2, success=True)
    return final_res


# ─── Referans Katsayıları ───────────────────────────────────────────────────
CARBON_PRICE_USD = 25.0          # USD/tCO₂e  — AB ETS gölge fiyatı (2025)
USD_TO_TRY       = 32.5          # 1 USD ≈ 32.5 TL  (referans kur)
ELECTRICITY_UNIT_TRY = 2.80      # TL/kWh — TEİAŞ 2024 sanayi tarifesi
RENEWABLE_SAVINGS_PCT = 0.35     # Yenilenebilir enerjiye geçiş = %35 enerji tasarrufu
GREEN_RATE_ADVANTAGE = 0.025     # Yeşil kredi faiz avantajı: standart - yeşil = %2.5
ESG_PREMIUM_FACTOR = 0.15        # ESG değerleme primi katsayısı
CARBON_CREDIT_USD = 22.0         # USD/tCO₂e — VCS/Gold Standard karbon kredisi fiyatı

# ─── Pydantic Modeller ──────────────────────────────────────────────────────
class ROIRequest(BaseModel):
    total_co2_tons: float = Field(description="Model C'den gelen toplam CO₂ emisyonu (tCO₂e)")
    extracted_activities: list = Field(description="Model C'den gelen aktivite listesi")
    investment_tl: float = Field(default=500_000.0, description="Yeşil dönüşüm yatırımı (TL)")
    loan_years: int = Field(default=5, description="Yeşil kredi vadesi (yıl)", ge=1, le=30)
    reduction_target_pct: float = Field(default=30.0, description="Hedeflenen emisyon azalma oranı (%)", ge=0, le=100)


class ROIBreakdown(BaseModel):
    carbon_tax_saving_tl: float
    energy_saving_tl: float
    green_loan_advantage_tl: float
    carbon_credit_revenue_tl: float
    esg_premium_tl: float
    total_annual_benefit_tl: float
    total_period_benefit_tl: float


class ROIResult(BaseModel):
    groi_percent: float
    payback_years: float
    green_finance_score: int          # 0-100
    green_finance_label: str
    green_finance_color: str
    net_benefit_tl: float
    annual_benefit_tl: float
    breakdown: ROIBreakdown
    recommendation: str
    audit_notes: List[str]


# ─── Hesaplama Motoru ────────────────────────────────────────────────────────
def _static_calculate_groi(req: ROIRequest) -> ROIResult:
    """
    5 bileşenli Green Finance ROI hesabı (Statik Fallback).
    Tüm adımlar denetim izine kaydedilir.
    """
    audit = []
    reduction_ratio = req.reduction_target_pct / 100.0
    co2_reduced = req.total_co2_tons * reduction_ratio

    # ── Bileşen 1: Karbon Vergisi / Ceza Tasarrufu ──────────────────────────
    carbon_saving_usd = co2_reduced * CARBON_PRICE_USD
    carbon_saving_tl  = carbon_saving_usd * USD_TO_TRY
    audit.append(
        f"[KARBON VERGİSİ] {co2_reduced:.2f} tCO₂e × {CARBON_PRICE_USD} USD × "
        f"{USD_TO_TRY} TL/USD = {carbon_saving_tl:,.0f} TL/yıl "
        f"[Kaynak: AB ETS Gölge Fiyatı 2025]"
    )

    # ── Bileşen 2: Enerji Maliyeti Tasarrufu ────────────────────────────────
    # Enerji aktivitelerinden kWh tüketimini tahmin et
    total_kwh = 0.0
    for act in req.extracted_activities:
        if act.get("category") == "enerji" and act.get("unit", "").lower() == "kwh":
            total_kwh += act.get("amount", 0)
    
    if total_kwh == 0:
        # Tahmin: CO₂ başına ortalama enerji yoğunluğu
        total_kwh = req.total_co2_tons * 1_500  # ~1500 kWh/tCO₂e varsayım
    
    energy_saving_tl = total_kwh * RENEWABLE_SAVINGS_PCT * ELECTRICITY_UNIT_TRY * reduction_ratio
    audit.append(
        f"[ENERJİ TASARRUFU] {total_kwh:,.0f} kWh × %{RENEWABLE_SAVINGS_PCT*100:.0f} tasarruf × "
        f"{ELECTRICITY_UNIT_TRY} TL/kWh × {reduction_ratio:.0%} hedef = "
        f"{energy_saving_tl:,.0f} TL/yıl [Kaynak: TEİAŞ 2024]"
    )

    # ── Bileşen 3: Yeşil Kredi Faiz Avantajı ────────────────────────────────
    green_loan_tl = req.investment_tl * GREEN_RATE_ADVANTAGE
    audit.append(
        f"[YEŞİL KREDİ] {req.investment_tl:,.0f} TL × %{GREEN_RATE_ADVANTAGE*100:.1f} "
        f"faiz avantajı = {green_loan_tl:,.0f} TL/yıl [Kaynak: TCMB Yeşil Kredi Referansı]"
    )

    # ── Bileşen 4: Karbon Kredisi Geliri ────────────────────────────────────
    credit_revenue_usd = co2_reduced * CARBON_CREDIT_USD
    credit_revenue_tl  = credit_revenue_usd * USD_TO_TRY
    audit.append(
        f"[KARBON KREDİSİ] {co2_reduced:.2f} tCO₂e × {CARBON_CREDIT_USD} USD × "
        f"{USD_TO_TRY} TL/USD = {credit_revenue_tl:,.0f} TL/yıl "
        f"[Kaynak: VCS/Gold Standard 2025]"
    )

    # ── Bileşen 5: ESG Değerleme Primi ──────────────────────────────────────
    base_benefit = carbon_saving_tl + energy_saving_tl + green_loan_tl + credit_revenue_tl
    esg_premium_tl = base_benefit * ESG_PREMIUM_FACTOR
    audit.append(
        f"[ESG PRİMİ] ({carbon_saving_tl:,.0f} + {energy_saving_tl:,.0f} + "
        f"{green_loan_tl:,.0f} + {credit_revenue_tl:,.0f}) × {ESG_PREMIUM_FACTOR:.0%} "
        f"= {esg_premium_tl:,.0f} TL/yıl [Kaynak: MSCI ESG Araştırma 2024]"
    )

    # ── Toplam Hesap ─────────────────────────────────────────────────────────
    annual_benefit = base_benefit + esg_premium_tl
    period_benefit = annual_benefit * req.loan_years
    net_benefit    = period_benefit - req.investment_tl

    # G-ROI %
    groi_pct = (net_benefit / req.investment_tl) * 100 if req.investment_tl > 0 else 0.0

    # Geri dönüş süresi
    payback = req.investment_tl / annual_benefit if annual_benefit > 0 else 999.0

    # ── Green Finance Skoru (0-100) ──────────────────────────────────────────
    # Katsayılar: ROI büyüklüğü %50, azalma hedefi %30, yatırım yeterliliği %20
    roi_score       = min(50, max(0, groi_pct / 4))          # Max 50 puan
    reduction_score = min(30, req.reduction_target_pct * 0.6)  # Max 30 puan
    invest_score    = min(20, (req.investment_tl / 50_000))    # Max 20 puan (1M TL = 20 puan)
    raw_score = roi_score + reduction_score + invest_score
    green_finance_score = int(min(100, max(0, raw_score)))

    # Etiket & Renk
    if green_finance_score >= 86:
        label = "Sürdürülebilirlik Öncüsü"
        color = "#D4AF37"   # altın
    elif green_finance_score >= 66:
        label = "Yeşil Finansmana Uygun"
        color = "#10B981"   # yeşil
    elif green_finance_score >= 41:
        label = "Gelişme Gerekli"
        color = "#F59E0B"   # sarı
    else:
        label = "Yüksek Karbon Riski"
        color = "#EF4444"   # kırmızı

    # ── Öneri Metni ──────────────────────────────────────────────────────────
    rec_lines = []
    if req.reduction_target_pct < 20:
        rec_lines.append("Emisyon azaltma hedefini en az %20'ye çıkarmanız G-ROI'yi önemli ölçüde artırır.")
    if payback > req.loan_years:
        rec_lines.append(f"Mevcut parametrelerle yatırımın geri dönüş süresi ({payback:.1f} yıl) kredi vadesini aşıyor; yatırım tutarını veya azaltma hedefini gözden geçirin.")
    if green_finance_score >= 66:
        rec_lines.append("Şirketiniz Yeşil Kredi Pasaportu için uygunluk kriterlerini karşılıyor. TSRS-2 raporlaması başlatılabilir.")
    if not rec_lines:
        rec_lines.append("Mevcut parametreler optimale yakın. Karbon kredisi sertifikasyonu (VCS/Gold Standard) için başvuru yapılabilir.")

    recommendation = " ".join(rec_lines)

    return ROIResult(
        groi_percent=round(groi_pct, 1),
        payback_years=round(payback, 1),
        green_finance_score=green_finance_score,
        green_finance_label=label,
        green_finance_color=color,
        net_benefit_tl=round(net_benefit, 0),
        annual_benefit_tl=round(annual_benefit, 0),
        breakdown=ROIBreakdown(
            carbon_tax_saving_tl=round(carbon_saving_tl, 0),
            energy_saving_tl=round(energy_saving_tl, 0),
            green_loan_advantage_tl=round(green_loan_tl, 0),
            carbon_credit_revenue_tl=round(credit_revenue_tl, 0),
            esg_premium_tl=round(esg_premium_tl, 0),
            total_annual_benefit_tl=round(annual_benefit, 0),
            total_period_benefit_tl=round(period_benefit, 0),
        ),
        recommendation=recommendation,
        audit_notes=audit,
    )


def calculate_groi(req: ROIRequest) -> ROIResult:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not HAS_LANGCHAIN:
        return _static_calculate_groi(req)
        
    params_text = f"""
    - Toplam Mevcut Emisyon: {req.total_co2_tons} ton CO2
    - Yeşil Dönüşüm Yatırımı (CAPEX): {req.investment_tl} TL
    - Hedeflenen Emisyon Azaltma Oranı: %{req.reduction_target_pct}
    - Kredi Vadesi: {req.loan_years} yıl
    - Çıkarılan Aktiviteler (Enerji tüketimi vd. tahmini için): {req.extracted_activities}
    """
    
    system_instruction = """
    Sen uzman bir Yeşil Finansman Kredi Analistisin. 
    Verilen parametrelere göre şirketin yeşil yatırım geri dönüşünü (G-ROI) hesaplamak için Python kodu yaz. 
    Aşağıdaki 5 bileşeni hesaplamalı ve sonucu 'print()' ile ekrana yazdırmalısın:
    1. Karbon Vergisi/Ceza Tasarrufu (TL/yıl)
    2. Enerji Maliyeti Tasarrufu (TL/yıl)
    3. Yeşil Kredi Faiz Avantajı (TL/yıl)
    4. Karbon Kredisi Geliri (TL/yıl)
    5. ESG Değerleme Primi (TL/yıl)
    
    Sonrasında:
    - Toplam yıllık faydayı ve periyot boyunca net faydayı hesapla.
    - G-ROI yüzdesini ve geri dönüş süresini (Payback years) bul.
    - Yeşil finansman skorunu (0-100) belirle.
    - Skor tabanlı bir etiket ve renk (Hex kod) ata.
    - Öneri metni oluştur.
    - Hesaplama adımlarını bir denetim notları (audit_notes) listesine ekle.
    Sadece çalıştırılabilir temiz Python kodu üret.
    """
    
    try:
        return _run_langchain_cot_pipeline(params_text, ROIResult, system_instruction)
    except Exception as e:
        print(f"Dinamik LangChain G-ROI hesaplama hatası: {e}. Statik modele düşülüyor.")
        return _static_calculate_groi(req)


class CreditScoreResult(BaseModel):
    green_credit_score: int
    financial_score: float
    environmental_score: float
    cash_flow_score: float
    decision: str
    discount_pct: float
    total_capex: float
    carbon_reduction: float
    new_emission: float
    annual_opex_savings: float
    groi_payback_years: float
    audit_notes: List[str]


def _static_calculate_green_credit(
    total_co2_tons: float,
    ges_budget: float,
    ev_count: int,
    eff_budget: float,
    waste_budget: float,
    water_budget: float,
    loan_amount: float,
    loan_years: int,
    financial_rating: str,
    extracted_activities: list = None
) -> CreditScoreResult:
    audit = []
    
    # 0. Kategorik Mevcut Karbon Dağılımını Hesapla (Greeenwashing Önleme Kuralı)
    hammadde_co2 = 0.0
    lojistik_co2 = 0.0
    enerji_co2 = 0.0
    
    if extracted_activities:
        for act in extracted_activities:
            cat = act.get("category", "").lower()
            co2 = act.get("co2_tons", 0.0)
            if cat == "hammadde":
                hammadde_co2 += co2
            elif cat == "lojistik":
                lojistik_co2 += co2
            elif cat == "enerji":
                enerji_co2 += co2
                
    # Girdi metninden spesifik kategoriler çıkmadıysa varsayılan oranlar
    if hammadde_co2 == 0.0 and lojistik_co2 == 0.0 and enerji_co2 == 0.0:
        baseline_co2 = total_co2_tons if total_co2_tons > 0.0 else 120.0
        # 120.0 tonun %15 hammadde, %25 lojistik, %60 enerji varsayılır
        hammadde_co2 = baseline_co2 * 0.15
        lojistik_co2 = baseline_co2 * 0.25
        enerji_co2 = baseline_co2 * 0.60
    else:
        baseline_co2 = hammadde_co2 + lojistik_co2 + enerji_co2

    # 1. Financial Rating Score (Max 40)
    rating_scores = {
        "AAA": 40.0,
        "AA": 37.0,
        "A": 34.0,
        "BBB": 30.0,
        "BB": 24.0,
        "B": 18.0,
        "C": 10.0
    }
    rating_clean = financial_rating.upper().strip()
    fin_score = rating_scores.get(rating_clean, 30.0)
    audit.append(f"[FİNANSAL SAĞLIK] Derecelendirme Notu: {rating_clean} -> Puan: {fin_score:.1f} / 40.0")
    
    # 2. Environmental Impact (Max 40)
    # Azaltım limitleri (Her kategori kendi baseline emisyonu ile sınırlıdır)
    ges_red_raw = ges_budget * 0.000008
    ges_limit = enerji_co2 * 0.75
    ges_reduction = min(ges_red_raw, ges_limit)
    if ges_red_raw > ges_limit:
        audit.append(f"[KONTROL - GES] GES azaltım limiti aşıldı! Ham: {ges_red_raw:.2f} t -> Sınırlanan: {ges_reduction:.2f} tCO₂e (Max %75 Enerji)")
        
    ev_red_raw = ev_count * 5.0
    ev_limit = lojistik_co2
    ev_reduction = min(ev_red_raw, ev_limit)
    if ev_red_raw > ev_limit:
        audit.append(f"[KONTROL - EV] Filo azaltım limiti aşıldı! Ham: {ev_red_raw:.2f} t -> Sınırlanan: {ev_reduction:.2f} tCO₂e (Max Lojistik)")
        
    eff_red_raw = eff_budget * 0.000012
    eff_limit = enerji_co2 * 0.25
    eff_reduction = min(eff_red_raw, eff_limit)
    if eff_red_raw > eff_limit:
        audit.append(f"[KONTROL - VERİMLİLİK] Enerji verimliliği azaltım limiti aşıldı! Ham: {eff_red_raw:.2f} t -> Sınırlanan: {eff_reduction:.2f} tCO₂e (Max %25 Enerji)")
        
    waste_red_raw = waste_budget * 0.000015
    waste_limit = hammadde_co2 * 0.30
    waste_reduction = min(waste_red_raw, waste_limit)
    if waste_red_raw > waste_limit:
        audit.append(f"[KONTROL - ATIK] Atık yönetimi azaltım limiti aşıldı! Ham: {waste_red_raw:.2f} t -> Sınırlanan: {waste_reduction:.2f} tCO₂e (Max %30 Hammadde)")
        
    water_red_raw = water_budget * 0.000005
    water_limit = 5.0
    water_reduction = min(water_red_raw, water_limit)
    
    total_reduction = ges_reduction + ev_reduction + eff_reduction + waste_reduction + water_reduction
    
    reduction_pct = (total_reduction / baseline_co2) * 100 if baseline_co2 > 0 else 0
    env_score = min(40.0, reduction_pct * 0.8) # %50 azaltıma tam 40 puan
    
    audit.append(
        f"[EKOLOJİK ETKİ] Azaltım: {total_reduction:.2f} tCO₂e / Mevcut: {baseline_co2:.2f} tCO₂e "
        f"(%{reduction_pct:.1f} Azaltım) -> Puan: {env_score:.1f} / 40.0"
    )
    
    # 3. Term & Cash Flow (Max 20)
    total_capex = ges_budget + (ev_count * 450000) + eff_budget + waste_budget + water_budget
    annual_opex_savings = (ges_budget * 0.18) + (ev_count * 55000) + (eff_budget * 0.24) + (waste_budget * 0.20) + (water_budget * 0.15)
    # Avoided carbon tax (AB ETS referanslı, 25 USD * 32.5 TL = 812.5 TL per ton)
    annual_tax_avoided = total_reduction * 25.0 * 32.5
    total_annual_return = annual_opex_savings + annual_tax_avoided
    
    payback_years = total_capex / total_annual_return if total_annual_return > 0 else 0.0
    
    if total_capex == 0:
        cf_score = 10.0
        audit.append("[VADE UYUMU] Planlanan yatırım bulunmuyor. Nötr Puan: 10.0 / 20.0")
    else:
        if payback_years <= loan_years:
            cf_score = 20.0
            audit.append(f"[VADE UYUMU] Proje Geri Dönüşü ({payback_years:.1f} yıl) <= Kredi Vadesi ({loan_years} yıl) -> Tam Puan: 20.0 / 20.0")
        else:
            cf_score = max(0.0, 20.0 * (loan_years / payback_years))
            audit.append(f"[VADE UYUMU] Proje Geri Dönüşü ({payback_years:.1f} yıl) > Kredi Vadesi ({loan_years} yıl) -> Oranlı Puan: {cf_score:.1f} / 20.0")
            
    # 4. Kredi Tutarı / CAPEX Gerçekçiliği (LTV & Finansman Oranı Cezası)
    financial_modifier = 0.0
    if total_capex > 0:
        if loan_amount > total_capex:
            financial_modifier = -20.0
            audit.append(f"[FİNANSAL RİSK] Kredi Talebi ({loan_amount:,.0f} ₺) toplam yeşil yatırımı ({total_capex:,.0f} ₺) aşıyor! (-20 Puan Ceza)")
        else:
            equity_amount = total_capex - loan_amount
            equity_ratio = (equity_amount / total_capex) * 100
            if equity_ratio >= 20.0:
                financial_modifier = 5.0
                audit.append(f"[FİNANSAL TEŞVİK] Şirket projeye %{equity_ratio:.1f} oranında özkaynak desteği sağlıyor (+5 Puan Ödül)")

    # Total Score
    total_score = int(round(fin_score + env_score + cf_score + financial_modifier))
    total_score = min(100, max(0, total_score))
    
    # Decision
    if total_score >= 80:
        decision = "ONAYLANDI (Yeşil Kredi Pasaportu Verildi)"
    elif total_score >= 50:
        decision = "KOŞULLU ONAY (Ek Teminat veya Emisyon Taahhüdü Gerekli)"
    else:
        decision = "REDDEDİLDİ (Yetersiz Yeşil Etki veya Yüksek Risk)"
        
    # Discount
    if total_score >= 50:
        discount_pct = min(1.5, (total_score / 100) * 1.5)
    else:
        discount_pct = 0.0
        
    new_emission = max(0.0, baseline_co2 - total_reduction)
    
    return CreditScoreResult(
        green_credit_score=total_score,
        financial_score=round(fin_score, 1),
        environmental_score=round(env_score, 1),
        cash_flow_score=round(cf_score, 1),
        decision=decision,
        discount_pct=round(discount_pct, 2),
        total_capex=round(total_capex, 0),
        carbon_reduction=round(total_reduction, 2),
        new_emission=round(new_emission, 2),
        annual_opex_savings=round(annual_opex_savings, 0),
        groi_payback_years=round(payback_years, 1),
        audit_notes=audit
    )


def calculate_green_credit(
    total_co2_tons: float,
    ges_budget: float,
    ev_count: int,
    eff_budget: float,
    waste_budget: float,
    water_budget: float,
    loan_amount: float,
    loan_years: int,
    financial_rating: str,
    extracted_activities: list = None
) -> CreditScoreResult:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not HAS_LANGCHAIN:
        return _static_calculate_green_credit(
            total_co2_tons, ges_budget, ev_count, eff_budget, waste_budget,
            water_budget, loan_amount, loan_years, financial_rating, extracted_activities
        )
    
    params_text = f"""
    - Toplam Mevcut Emisyon: {total_co2_tons} ton CO2
    - GES Bütçesi: {ges_budget} TL
    - Elektrikli Araç Sayısı: {ev_count}
    - Enerji Verimliliği Bütçesi: {eff_budget} TL
    - Atık Yönetimi Bütçesi: {waste_budget} TL
    - Su Verimliliği Bütçesi: {water_budget} TL
    - Kredi Talebi: {loan_amount} TL
    - Kredi Vadesi: {loan_years} yıl
    - Finansal Not: {financial_rating}
    - Çıkarılan Aktiviteler: {extracted_activities}
    """
    
    system_instruction = """
    Sen uzman bir Yeşil Finansman Kredi Analistisin. 
    Verilen parametrelere göre şirketin yeşil kredi skorunu (Green Credit Score) dinamik olarak Python kodu yazıp hesaplamalısın.
    Aşağıdaki adımları hesapla ve sonuçları 'print()' ile ekrana yazdır:
    1. Finansal skor (40 üzerinden), Çevresel etki skoru (40 üzerinden) ve Vade/Nakit Akışı skorunu (20 üzerinden) hesapla. Finansal oran cezalarını veya ödüllerini ekle.
    2. Karbon emisyon azaltım miktarını ve azaltım sonrası yeni emisyonları hesapla.
    3. Toplam yatırım miktarını (CAPEX) ve yıllık operasyonel tasarrufları hesapla.
    4. Geri dönüş süresini (Payback years) bul.
    5. Nihai yeşil kredi skorunu 0-100 arasında topla.
    6. Skor tabanlı bir kredi kararı ("ONAYLANDI", "KOŞULLU ONAY", "REDDEDİLDİ") ve potansiyel faiz indirimi (%) belirle.
    7. Tüm bu hesaplama adımlarını adım adım bir denetim notları (audit_notes) listesine ekle.
    Sadece çalıştırılabilir temiz Python kodu üret.
    """
    
    try:
        return _run_langchain_cot_pipeline(params_text, CreditScoreResult, system_instruction)
    except Exception as e:
        print(f"Dinamik LangChain hesaplama hatası: {e}. Statik modele düşülüyor.")
        return _static_calculate_green_credit(
            total_co2_tons, ges_budget, ev_count, eff_budget, waste_budget,
            water_budget, loan_amount, loan_years, financial_rating, extracted_activities
        )

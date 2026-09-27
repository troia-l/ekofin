"""
Karbon Hesaplama, Yeşil Kredi ve Simülatör (G-ROI) Router'ı
"""

import os
from typing import Optional

from fastapi import APIRouter, HTTPException

from config import get_company_report_path
from modules.carbon.extractor import extract_activities
from modules.carbon.roi import calculate_groi, ROIRequest, calculate_green_credit
from .common import (
    CalculationRequest,
    calculator,
    COMPANY_DETAILS,
)

router = APIRouter(tags=["Carbon & Simulator"])


@router.post("/api/carbon/calculate")
def calculate_carbon(req: CalculationRequest):
    """Metin gir → karbon hesabı + Yeşil Kredi Skoru al."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        # Aşama 1: Yapılandırılmış aktivite çıkarımı
        extracted_data = extract_activities(req.text)

        # Aşama 2: Deterministik karbon hesaplama
        carbon_result = calculator.process_calculation(extracted_data)

        # Aşama 3: Yeşil Kredi Skorlama
        credit_result = calculate_green_credit(
            total_co2_tons=carbon_result["total_co2_tons"],
            ges_budget=req.ges_budget,
            ev_count=req.ev_count,
            eff_budget=req.eff_budget,
            waste_budget=req.waste_budget,
            water_budget=req.water_budget,
            loan_amount=req.loan_amount,
            loan_years=req.loan_years,
            financial_rating=req.financial_rating,
            extracted_activities=carbon_result["results"]
        )

        # Aşama 4: G-ROI Hesaplama (GreenROI.jsx uyumluluğu için)
        roi_req = ROIRequest(
            total_co2_tons=carbon_result["total_co2_tons"],
            extracted_activities=carbon_result["results"],
            investment_tl=req.investment_tl if req.investment_tl is not None else req.loan_amount,
            loan_years=req.loan_years,
            reduction_target_pct=req.reduction_target_pct if req.reduction_target_pct is not None else 30.0
        )
        groi_result = calculate_groi(roi_req)

        return {
            "status": "success",
            "total_co2_tons": carbon_result["total_co2_tons"],
            "audit_trail": carbon_result["audit_trail"],
            "extracted_activities": carbon_result["results"],
            "credit_score": {
                "green_credit_score": credit_result.green_credit_score,
                "financial_score": credit_result.financial_score,
                "environmental_score": credit_result.environmental_score,
                "cash_flow_score": credit_result.cash_flow_score,
                "decision": credit_result.decision,
                "discount_pct": credit_result.discount_pct,
                "total_capex": credit_result.total_capex,
                "carbon_reduction": credit_result.carbon_reduction,
                "new_emission": credit_result.new_emission,
                "annual_opex_savings": credit_result.annual_opex_savings,
                "groi_payback_years": credit_result.groi_payback_years,
                "audit_notes": credit_result.audit_notes
            },
            "groi": groi_result.model_dump()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata: {str(e)}")


@router.get("/api/simulator/auto-context")
def get_simulator_auto_context(ticker: Optional[str] = None):
    """
    Şirketin mevcut durumunu TSRS raporundan otomatik derler ve 
    LLM (Gemini) üzerinden şirkete özel yeşil yatırım (GES, EV, Verimlilik) önerileri üretir.
    """
    from modules.esg_prediction.kap_loader import get_kap_features_for_ticker, BIST_KAP_PROFILES
    
    current_ticker = (ticker or "ASELS").strip().upper()
    features = get_kap_features_for_ticker(current_ticker)
    
    # 1. Gerçek kurumsal kimlik ve sektör eşlemesi
    details = COMPANY_DETAILS.get(current_ticker, {})
    kap_info = BIST_KAP_PROFILES.get(current_ticker, {})
    official_name = kap_info.get("name") or details.get("name")
    industry = details.get("sector") or getattr(features, "Industry", "İmalat & Teknoloji")
    
    report_path = get_company_report_path(current_ticker)
    report_text = ""
    company_name = official_name or f"{current_ticker} Sanayi ve Ticaret A.Ş."
    report_found = False
    
    if report_path.exists():
        try:
            with open(report_path, "r", encoding="utf-8") as f:
                report_text = f.read()
            report_found = True
            lines = report_text.splitlines()
            for line in lines[:10]:
                if line.startswith("# ") and len(line) > 3:
                    extracted = line.replace("#", "").strip()
                    # Eğer resmi bir BIST profili yoksa rapordaki adı kullan
                    if not official_name or current_ticker not in BIST_KAP_PROFILES:
                        company_name = extracted
                    break
        except Exception as e:
            print(f"Report read error: {e}")
            
    # Sektör ve TSRS operasyon metrikleri
    annual_kwh = round(features.EnergyConsumption, 0)
    monthly_kwh = round(annual_kwh / 12, 0)
    carbon_emissions = round(features.CarbonEmissions, 1)
    
    # TSRS Raporundan özetlenen kurumsal durum
    current_status = (
        f"{company_name} ({current_ticker}), {industry} sektöründe faaliyet göstermektedir. "
        f"KAP ve TSRS operasyonel göstergelerine göre yıllık enerji tüketimi {annual_kwh:,.0f} kWh, "
        f"yıllık toplam karbon salımı {carbon_emissions:,.1f} tCO2e düzeyindedir. "
        f"Operasyonel tesis ve lojistik kaynaklı geçiş riskleri bulunmakta olup yeşil dönüşüm yatırımları planlanmaktadır."
    )
    
    # Otomatik faaliyet metni (Karbon motoru model_c için arka plan girdisi)
    activity_text = (
        f"Aylık {round(features.Revenue/1000000, 1)} ton eşdeğer endüstriyel operasyon, "
        f"şirket bünyesinde 4 lojistik ticari araç ile 3500 km saha operasyonu, "
        f"{monthly_kwh:,.0f} kWh elektrik şebeke tüketimi ve {round(features.WaterUsage/12, 0):,.0f} m3 endüstriyel proses suyu tüketimi."
    )

    # 2. LLM ile yeşil yatırım önerisi katmanı (Gemini)
    gemini_key = os.getenv("GEMINI_API_KEY")
    llm_recommendation = None
    
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.prompts import ChatPromptTemplate
            
            model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=gemini_key)
            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "Sen bir kurumsal sürdürülebilirlik ve yeşil finansman (G-ROI) baş danışmanısın. "
                    "Şirketin adı, sektörü ve TSRS göstergelerinden derlenen operasyonel durumu verilecek. "
                    "Bu şirketin sektörüne ve ölçeğine birebir uygun, karbon ayak izini düşürecek ve TSRS uyumunu artıracak "
                    "en etkili yeşil yatırım kalemlerini (GES, Ticari Filo Elektrifikasyonu/EV, Enerji Verimliliği, Atık/Depolama) "
                    "gerekçeleri ve yaklaşık bütçeleriyle 2-3 maddede net, profesyonel bir dille tavsiye et."
                )),
                ("human", f"Şirket: {company_name} ({current_ticker})\nSektör: {industry}\nMevcut Durum:\n{current_status}")
            ])
            chain = prompt | model
            res = chain.invoke({})
            llm_recommendation = res.content
        except Exception as e:
            print(f"LLM Error in auto-context: {e}")

    # Şirkete/Sektöre özel kural tabanlı öneri ve yatırım bütçeleri (LLM yoksa veya tamamlayıcı olarak)
    if current_ticker == "ZOREN":
        default_rule_rec = (
            f"TSRS Raporu ve KAP operasyonel göstergelerine istinaden {company_name} (ZOREN) için önerilen yeşil yatırım stratejisi:\n\n"
            f"1. **Yardımcı Kaynak Hibrit GES & Depolama:** Jeotermal ve rüzgar santrallerinde öz tüketimi karşılamak ve iletim hattı verimliliğini artırmak amacıyla 1.500.000 TL bütçeli 500 kWp hibrit GES ve BESS batarya depolama entegrasyonu önerilir.\n"
            f"2. **ZES Şarj İstasyonu Ağının Karbon Nötr Dönüşümü:** Türkiye genelindeki ZES elektrikli araç şarj istasyonlarının doğrudan yenilenebilir kaynaklardan (IREC sertifikalı) beslenmesi ve şarj istasyonlarında yerinde mikro GES kurulumu (Önerilen: 5 Lokasyon).\n"
            f"3. **Santral İçi Yardımcı Enerji Verimliliği:** Üretim santrallerindeki soğutma kuleleri, reenjeksiyon pompaları ve yardımcı tesis motorlarında akıllı frekans sürücüleri ile %16 enerji tasarrufu sağlanmalıdır (Önerilen Bütçe: 400.000 TL)."
        )
        suggested_investments = {
            "ges_checked": True,
            "ges_budget": 1500000,
            "ev_checked": True,
            "ev_count": 5,
            "eff_budget": 400000,
            "waste_budget": 100000,
            "water_budget": 80000,
            "loan_amount": 1800000,
            "loan_years": 5,
            "financial_rating": "A"
        }
    elif current_ticker == "ASELS":
        default_rule_rec = (
            f"TSRS Raporu ve KAP operasyonel göstergelerine istinaden {company_name} (ASELS) için önerilen yeşil yatırım stratejisi:\n\n"
            f"1. **Macunköy & Temelli Kampüsleri Çatı/Otopark GES:** Yıllık {annual_kwh:,.0f} kWh elektrik tüketen yüksek teknolojili Ar-Ge ve temiz oda tesislerinin Kapsam 2 emisyonlarını sıfırlamak için 950.000 TL bütçeli 300 kWp GES kurulumu önerilir (Yıllık ~%22 OPEX tasarrufu).\n"
            f"2. **Kampüs İçi Sıfır Emisyonlu Ring & Servis Elektrifikasyonu:** Tesisler arası malzeme ve personel ring taşımacılığında kullanılan araçların ticari elektrikli araçlarla (EV) ikamesi (Önerilen: 4 Araç).\n"
            f"3. **Temiz Oda ve HVAC Isı Geri Kazanımı:** Radar ve mikroelektronik üretim laboratuvarlarında iklimlendirme ve basınçlandırma kaynaklı enerji kayıplarını önleyen akıllı HVAC verimlilik modernizasyonu (Önerilen Bütçe: 350.000 TL)."
        )
        suggested_investments = {
            "ges_checked": True,
            "ges_budget": 950000,
            "ev_checked": True,
            "ev_count": 4,
            "eff_budget": 350000,
            "waste_budget": 120000,
            "water_budget": 60000,
            "loan_amount": 1200000,
            "loan_years": 5,
            "financial_rating": "AA"
        }
    else:
        default_rule_rec = (
            f"TSRS Raporu ve KAP operasyonel göstergelerine istinaden {company_name} için önerilen yeşil yatırım stratejisi:\n\n"
            f"1. **Çatı Tipi Güneş Enerjisi Santrali (GES):** Şirketin aylık {monthly_kwh:,.0f} kWh elektrik tüketiminin şebekeden çekilmesini sonlandırmak ve Kapsam 2 emisyonlarını sıfırlamak için 800.000 TL bütçeli 250 kWp GES kurulumu önerilir (Yıllık ~%18 OPEX tasarrufu).\n"
            f"2. **Ticari Filo Elektrifikasyonu (EV):** Operasyonel dağıtımda kullanılan dizel araçların elektrikli ticari araçlar (EV) ile ikamesi önerilir. Bu dönüşüm lojistik kaynaklı Kapsam 1 salımlarını doğrudan bertaraf edecektir (Önerilen: 3 Araç).\n"
            f"3. **Motor & Hat Verimliliği:** Üretim hatlarında frekans konvertörlü akıllı sürücüler ve atık ısı geri kazanımı ile %25 enerji verimliliği sağlanmalıdır (Önerilen Bütçe: 250.000 TL)."
        )
        suggested_investments = {
            "ges_checked": True,
            "ges_budget": 800000,
            "ev_checked": True,
            "ev_count": 3,
            "eff_budget": 250000,
            "waste_budget": 150000,
            "water_budget": 75000,
            "loan_amount": 1000000,
            "loan_years": 5,
            "financial_rating": "BBB"
        }

    if not llm_recommendation:
        llm_recommendation = default_rule_rec

    return {
        "status": "success",
        "company_ticker": current_ticker,
        "company_name": company_name,
        "industry": industry,
        "report_found": report_found,
        "current_status": current_status,
        "llm_recommendation": llm_recommendation,
        "suggested_investments": suggested_investments,
        "activity_text": activity_text,
        "context": f"{current_status}\n\n{llm_recommendation}"
    }

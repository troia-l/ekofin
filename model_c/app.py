from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from model import extract_activities
from calculator import CarbonCalculator
from roi import calculate_groi, ROIRequest, calculate_green_credit
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Model C: EkoFin Hibrit Karbon & Yeşil Kredi Skorlama API",
    description="LangChain ve Gemini destekli emisyon hesaplama ve Yeşil Kredi Skorlama motoru.",
    version="3.0.0"
)

# CORS — web uygulamasının erişimine izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calculator = CarbonCalculator()

# ─── Request Modeller ────────────────────────────────────────────────────────
class CalculationRequest(BaseModel):
    text: str
    ges_budget: float = Field(default=0.0, description="GES Yatırımı (TL)")
    ev_count: int = Field(default=0, description="Elektrikli Araç Sayısı")
    eff_budget: float = Field(default=0.0, description="Enerji Verimliliği Bütçesi (TL)")
    waste_budget: float = Field(default=0.0, description="Atık Yönetimi Bütçesi (TL)")
    water_budget: float = Field(default=0.0, description="Su Verimliliği Bütçesi (TL)")
    loan_amount: float = Field(default=500_000.0, description="Talep Edilen Kredi (TL)")
    loan_years: int = Field(default=5, description="Kredi vadesi (yıl)")
    financial_rating: str = Field(default="BBB", description="Derecelendirme Notu: AAA, AA, A, BBB, BB, B, C")

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "message": "Model C v3.0 — Karbon Hesaplama & Yeşil Kredi Skorlama API Aktif.",
        "endpoints": {
            "calculate": "POST /calculate — Karbon + Yeşil Kredi analizi",
            "docs": "/docs"
        },
        "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY"))
    }


@app.post("/calculate")
def calculate_carbon(req: CalculationRequest):
    """
    Tek endpoint: metin gir → karbon hesabı + Yeşil Kredi Skoru al.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        # ── Aşama 1: Gemini LLM (LCEL) ile yapılandırılmış aktivite çıkarımı ──────
        extracted_data = extract_activities(req.text)

        # ── Aşama 2: Deterministik karbon hesaplama motoru ──────────────────
        carbon_result = calculator.process_calculation(extracted_data)

        # ── Aşama 3: Yeşil Kredi Skorlama motoru ───────────────────────────────
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

        return {
            "status": "success",
            # Karbon sonuçları
            "total_co2_tons": carbon_result["total_co2_tons"],
            "audit_trail": carbon_result["audit_trail"],
            "extracted_activities": carbon_result["results"],
            # Yeşil Kredi Sonuçları
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
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8005, reload=True)

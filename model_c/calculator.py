import json
import os

class CarbonCalculator:
    def __init__(self, factors_path="factors.json"):
        self.factors_path = factors_path
        self.factors = self.load_factors()
        
    def load_factors(self):
        # Fallback factors if factors.json is missing
        if not os.path.exists(self.factors_path):
            default_factors = {
                "hammadde": {
                    "pamuk": { "factor": 0.42, "unit": "kg", "source": "Ecoinvent v3.9" },
                    "plastik_polimer": { "factor": 1.95, "unit": "kg", "source": "Ecoinvent v3.9" },
                    "celik": { "factor": 1.85, "unit": "kg", "source": "Ecoinvent v3.9" }
                },
                "lojistik": {
                    "dizel_kamyon": { "factor": 0.18, "unit": "km", "source": "DEFRA 2025" },
                    "benzinli_binek": { "factor": 0.12, "unit": "km", "source": "DEFRA 2025" }
                },
                "enerji": {
                    "elektrik_sebeke": { "factor": 0.45, "unit": "kWh", "source": "TEİAŞ 2024" },
                    "dogalgaz": { "factor": 2.1, "unit": "m3", "source": "DEFRA 2025" }
                }
            }
            with open(self.factors_path, 'w', encoding='utf-8') as f:
                json.dump(default_factors, f, indent=2, ensure_ascii=False)
            return default_factors
            
        with open(self.factors_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def calculate_activity_emissions(self, category: str, item_type: str, amount: float, unit: str):
        # 1. Kategori kontrolü
        cat_data = self.factors.get(category)
        if not cat_data:
            return 0.0, f"Bilinmeyen kategori: {category} [Hesaplanamadı]"
            
        # 2. Öğe kontrolü
        item_data = cat_data.get(item_type)
        if not item_data:
            return 0.0, f"Bilinmeyen öğe türü: '{item_type}' (kategori: {category}) [Hesaplanamadı]"
            
        factor = item_data["factor"]
        target_unit = item_data["unit"]
        source = item_data["source"]
        
        # 3. Birim Normalleştirme (Unit Normalization)
        normalized_amount = amount
        conversion_log = ""
        
        # Ton -> Kg dönüşümü (Ham maddeler için)
        if unit.lower() == "ton" and target_unit.lower() == "kg":
            normalized_amount = amount * 1000
            conversion_log = f"({amount} ton -> {normalized_amount} kg dönüştürüldü)"
        # Gram -> Kg
        elif unit.lower() == "g" and target_unit.lower() == "kg":
            normalized_amount = amount / 1000
            conversion_log = f"({amount} g -> {normalized_amount} kg dönüştürüldü)"
        # Birimler uyuşmuyorsa uyarı bas
        elif unit.lower() != target_unit.lower():
            conversion_log = f"(Uyarı: Birim uyuşmazlığı, doğrudan katsayı ile çarpıldı: {unit} -> {target_unit})"

        # Karbon salınımı hesaplama (kg CO2e olarak)
        emissions_kg = normalized_amount * factor
        # Ton cinsine çevirme (Uluslararası raporlama tCO2e cinsindendir)
        emissions_tons = emissions_kg / 1000
        
        trace = (
            f"[{category.upper()}] {amount} {unit} {item_type} x {factor} kgCO2e/{target_unit} = "
            f"{emissions_tons:.3f} tCO2e {conversion_log} [Kaynak: {source}]"
        )
        
        return emissions_tons, trace

    def process_calculation(self, extracted_model):
        results = []
        total_co2 = 0.0
        audit_trail = []
        
        for act in extracted_model.company_activities:
            co2, trace = self.calculate_activity_emissions(
                category=act.category,
                item_type=act.item_type,
                amount=act.amount,
                unit=act.unit
            )
            total_co2 += co2
            audit_trail.append(trace)
            results.append({
                "category": act.category,
                "item_type": act.item_type,
                "amount": act.amount,
                "unit": act.unit,
                "co2_tons": round(co2, 3)
            })
            
        return {
            "total_co2_tons": round(total_co2, 3),
            "results": results,
            "audit_trail": audit_trail
        }

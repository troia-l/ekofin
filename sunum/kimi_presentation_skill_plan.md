# Kimi Presentation Skill Ekleme Planı

## 1. Hedef: Eklenecek Skiller

| # | Skill Adı | Kaynak | Amaç | Format |
|---|-----------|--------|------|--------|
| 1 | **pptx-from-layouts** | `tristan-mcinnis/pptx-from-layouts-skill` (GitHub) | Markdown outline'dan gerçek PPTX üretmek (template layout'ları kullanarak) | Claude Code Skill |
| 2 | **Presentation Design Diagnostic** | `jwynia/agent-skills/presentation-design` (explainx.ai) | Sunum tasarım kalitesini değerlendirmek, assertion-evidence yapısı, cognitive load yönetimi | Agent Skill |
| 3 | **Marp Slides** | GitHub (Claude Code skill) | Markdown → PDF/PPTX/HTML sunumlar (22 örnek deck, SVG chart) | Claude Code Skill |
| 4 | **Slidev Skill** | GitHub (Claude Code skill) | Developer-friendly interaktif HTML sunumlar (Vue/React tabanlı) | Claude Code Skill |
| 5 | **Visual Explainer** | GitHub (Claude Code skill) | Zengin HTML diagram/slide deck'ler üretmek (en çok yıldız alan agent skill) | Agent Skill |
| 6 | **TAM/SAM/SOM Framework** | Kendi oluşturacağımız | Pazar analizi sunumları için TAM/SAM/SOM vizualizasyonu ve yapısı | Custom Kimi Skill |
| 7 | **SCQA / Pyramid Principle** | Kendi oluşturacağımız | Stratejik sunum yapıları (Situation-Complication-Question-Answer) | Custom Kimi Skill |

---

## 2. Kimi'de Skill Ekleme Yöntemleri

### Yöntem A: Kimi Web (Kimi Agent) - Document to Skills
**Adımlar:**
1. Kimi web'e git → "Plugins" → "Skills" → "Customize" → "Document to Skills"
2. Skill dokümanını (Word/PDF/Markdown) yükle
3. Kimi otomatik analiz edip skill'e dönüştürür
4. Düzenle, kaydet, .md olarak indir

**Sınırlama:** Sadece Kimi web/agent ortamında çalışır. Claude Code skill'leri doğrudan import edilemez.

### Yöntem B: Kimi Code CLI - SKILL.md Import
**Adımlar:**
1. Kimi Code CLI kur (`npm install -g kimi-code` veya `pip install kimi-code`)
2. `~/.kimi/skills/` veya proje dizininde `./skills/` oluştur
3. Her skill için klasör + `SKILL.md` dosyası yerleştir
4. Kimi Code otomatik discovery yapar (startup'ta `name` ve `description` okur, task match edince full content yükler)

**Önemli:** Kimi Code 0.13.0+ sürümünde `/import-from-cc-codex` komutu var - Claude Code ve Codex skill'lerini import edebilir. citeweb_search:4#3

### Yöntem C: Kimi Claw - ClawHub Skill Library
**Adımlar:**
1. Kimi Claw aç (Allegretto+ üyelik gerek)
2. "Skills" bölümüne git
3. ClawHub'da 5000+ skill arasından presentation ile ilgili olanları ara
4. İstediğini tek tıkla yükle
5. `/skill_adi` ile çağır veya doğal dilde kullan

---

## 3. Skill Formatı (SKILL.md Yapısı)

```yaml
---
name: presentation-design
description: "Designs and evaluates presentations using assertion-evidence structure, cognitive load management, and visual strategy. Supports TAM/SAM/SOM, SCQA, and Pyramid Principle frameworks."
license: MIT
compatibility:
  - kimi-code
  - kimi-claw
metadata:
  author: bera-eren
  version: 1.0.0
  tags:
    - presentation
    - design
    - slides
    - pptx
---

# Presentation Design Skill

## When to Activate
Activate when user asks for:
- Creating a presentation or slide deck
- Designing slides for a topic
- Evaluating presentation quality
- TAM/SAM/SOM market analysis visualization
- Strategic presentation frameworks (SCQA, Pyramid)

## Workflow

### Phase 1: Audience & Content Planning
1. Define audience persona and knowledge level
2. Write one-sentence main message
3. Identify 3-5 supporting points
4. Mark content as Essential / Standard / Expandable
5. Define time constraints

### Phase 2: Visual Strategy
- Use assertion-evidence structure (NOT bullet points)
- Assertion: Clear, complete sentence stating the point
- Evidence: Visual that supports the assertion
- Max 3-5 colors, 2-3 fonts, generous whitespace

### Phase 3: Structure Patterns
- Horizontal slides: Main narrative flow
- Vertical slides: Supporting details (deep dives)
- Progressive disclosure: Build complex ideas step by step

### Phase 4: Quality Check
- One concept per slide
- Spoken vs. Shown balance
- Accessibility: contrast, font size, inclusive language
- No animation circus, no bullet point disease

## Output Format
Structure each slide as:
```
# Slide N: [Title]
**Visual: [type]**
[Assertion sentence]

[Evidence description or data]
```

Visual types: hero-statement, process-N-phase, comparison-N, cards-N, table, timeline-horizontal, quote-hero
```

---

## 4. Uygulama Planı (Adım Adım)

### Adım 1: Kimi Code CLI Kurulumu
```bash
# npm ile
npm install -g kimi-code

# veya pip ile
pip install kimi-code

# Versiyon kontrol
kimi --version
```

### Adım 2: Skill Dizini Oluşturma
```bash
mkdir -p ~/.kimi/skills/presentation-design
mkdir -p ~/.kimi/skills/pptx-from-layouts
mkdir -p ~/.kimi/skills/marp-slides
mkdir -p ~/.kimi/skills/visual-explainer
mkdir -p ~/.kimi/skills/tam-sam-som-framework
```

### Adım 3: Claude Code Skill'lerini Import Etme (Kimi Code 0.13.0+)
```bash
# Kimi Code içinde çalıştır
/import-from-cc-codex
# Ardından GitHub repo URL'lerini ver:
# - https://github.com/tristan-mcinnis/pptx-from-layouts-skill
# - https://github.com/.../marp-slides
# - https://github.com/.../visual-explainer
```

**Not:** Eğer `/import-from-cc-codex` çalışmazsa, manuel olarak:
1. GitHub'dan `.claude/skills/` klasörünü indir
2. `SKILL.md` ve varsa `scripts/`, `references/`, `assets/` klasörlerini kopyala
3. `~/.kimi/skills/[skill-name]/` altına yerleştir

### Adım 4: Custom Skill Oluşturma (TAM/SAM/SOM, SCQA)
```bash
# Her skill için SKILL.md yaz
cat > ~/.kimi/skills/tam-sam-som-framework/SKILL.md << 'EOF'
---
name: tam-sam-som-framework
description: "Generates TAM/SAM/SOM market analysis visualizations and structured presentations for market sizing and competitive positioning."
---
# TAM/SAM/SOM Framework

## When to Activate
- Market sizing analysis
- Competitive positioning presentation
- Investor pitch deck market slide
- Business plan market section

## Structure
1. TAM (Total Addressable Market): Tüm potansiyel pazar
2. SAM (Serviceable Addressable Market): Ulaşılabilir pazar
3. SOM (Serviceable Obtainable Market): Kısa vadeli ele geçirilebilir pazar

## Visualization Types
- Concentric circles (TAM > SAM > SOM)
- Bar chart (market size comparison)
- Funnel diagram
- Pyramid structure
- Triangle diagram

## Output Format
```markdown
# Slide: Market Opportunity
**Visual: concentric-circles**

TAM: $[X]B - Global [industry] market
SAM: $[Y]B - [Region/Segment] addressable market  
SOM: $[Z]B - Target obtainable in [timeframe]

Key Drivers:
- [Driver 1]
- [Driver 2]
- [Driver 3]
```
EOF
```

### Adım 5: Kimi Code'da Skill Kullanımı
```bash
# Yeni bir Kimi Code session başlat (skill discovery için)
kimi

# Skill listesini gör
/skills

# Skill'i çağır
/presentation-design

# Veya doğal dilde:
"Bana TAM/SAM/SOM analizi içeren bir investor pitch deck hazırla"
"Bu outline'ı assertion-evidence yapısına göre düzenle"
```

### Adım 6: Kimi Claw ile Sync (Opsiyonel)
```bash
# Kimi Claw'da skill'leri sync et
# Kimi Agent (web)'te oluşturulan skill'ler Kimi Claw'a otomatik sync olur
# ClawHub'dan 5000+ skill arasından presentation ile ilgili olanları ara ve yükle
```

---

## 5. Skill Kombinasyonları (Workflow Zincirleme)

| Senaryo | Skill Zinciri | Çıktı |
|---------|-------------|-------|
| **Investor Pitch Deck** | `tam-sam-som-framework` → `presentation-design` → `pptx-from-layouts` | Profesyonel PPTX |
| **Teknik Sunum** | `presentation-design` → `marp-slides` veya `slidev` | Markdown → PDF/HTML |
| **Rapor/Diagram** | `visual-explainer` → `presentation-design` (QA) | Zengin HTML deck |
| **Hızlı Draft** | `presentation-design` (outline) → `marp-slides` (render) | Hızlı PDF |

---

## 6. Önemli Notlar & Sınırlamalar

1. **Kimi Code vs Kimi Web:** Kimi Code CLI'da skill'ler `~/.kimi/skills/` altında dosya tabanlı çalışır. Kimi Web/Agent'te "Document to Skills" ile oluşturulur, cloud'da saklanır.

2. **Claude Code Skill Uyumsuzluğu:** Claude Code skill'leri `~/.claude/skills/` yapısında olabilir. Kimi Code `/import-from-cc-codex` ile import edebilir ama manuel adaptasyon gerekebilir (özellikle `allowed-tools` gibi alanlar).

3. **Kimi Claw Gereksinimi:** Cloud deploy için Allegretto+ üyelik gerek. Local OpenClaw bağlantısı ücretsiz ama skill sync'i sınırlı.

4. **Progressive Disclosure:** Kimi Code skill'leri startup'ta sadece `name` + `description` okur. Task match edince full `SKILL.md` yükler. Bu yüzden `description` çok kritik - skill'in ne zaman aktive olacağını net yaz. citeweb_search:4#12

5. **PPTX Export:** Sadece `pptx-from-layouts` gerçek PowerPoint (.pptx) üretir. Diğer skill'ler HTML/PDF çıktı verir.

---

## 7. Hızlı Başlangıç Komutları

```bash
# 1. Kimi Code kur
npm install -g kimi-code

# 2. Skill dizini oluştur
mkdir -p ~/.kimi/skills

# 3. Presentation Design skill'i oluştur (başlangıç için yeterli)
cat > ~/.kimi/skills/presentation-design/SKILL.md << 'SKILL'
---
name: presentation-design
description: "Designs professional presentations with assertion-evidence structure, visual strategy, and cognitive load management. Supports TAM/SAM/SOM, SCQA, and Pyramid Principle frameworks."
---
# Presentation Design

## Rules
- NO bullet points. Use assertion + evidence structure.
- One concept per slide.
- Max 3-5 colors, generous whitespace.
- Mark content: Essential / Standard / Expandable.
- Progressive disclosure for complex ideas.

## Visual Types
hero-statement, process-N-phase, comparison-N, cards-N, table, timeline, quote-hero

## Frameworks
TAM/SAM/SOM, SCQA, Pyramid Principle, MECE
SKILL

# 4. Kimi Code başlat ve test et
kimi
# "Bana bir TAM/SAM/SOM market analysis sunumu hazırla"
```

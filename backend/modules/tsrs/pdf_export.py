"""Kurumsal görünümlü TSRS rapor PDF çıktısı."""
from __future__ import annotations

import html
import re
from datetime import datetime
from io import BytesIO
from pathlib import Path

import base64
from PIL import Image as PILImage

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


INK = colors.HexColor("#12243A")
EMERALD = colors.HexColor("#087F68")
MUTED = colors.HexColor("#667085")
PALE = colors.HexColor("#F1F7F5")
LINE = colors.HexColor("#DCE5E2")


def _register_fonts() -> tuple[str, str]:
    regular_candidates = (
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    )
    bold_candidates = (
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    )
    regular_path = next((path for path in regular_candidates if Path(path).is_file()), None)
    bold_path = next((path for path in bold_candidates if Path(path).is_file()), None)
    if not regular_path:
        return "Helvetica", "Helvetica-Bold"

    if "EkoFinUnicode" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("EkoFinUnicode", regular_path))
    if bold_path and "EkoFinUnicode-Bold" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("EkoFinUnicode-Bold", bold_path))
    bold_name = "EkoFinUnicode-Bold" if bold_path else "EkoFinUnicode"
    pdfmetrics.registerFontFamily("EkoFinUnicode", normal="EkoFinUnicode", bold=bold_name,
                                  italic="EkoFinUnicode", boldItalic=bold_name)
    return "EkoFinUnicode", bold_name


def _inline_markup(value: str) -> str:
    code_spans: list[str] = []

    def hold_code(match: re.Match[str]) -> str:
        code_spans.append(html.escape(match.group(1), quote=False))
        return f"EKOFINCODETOKEN{len(code_spans) - 1}END"

    value = re.sub(r"`([^`]+)`", hold_code, value)
    value = html.escape(value, quote=False)
    value = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        lambda match: f'<link href="{html.escape(match.group(2), quote=True)}" color="#087F68">{match.group(1)}</link>',
        value,
    )
    value = re.sub(r"\*\*(.+?)\*\*|__(.+?)__", lambda m: f"<b>{m.group(1) or m.group(2)}</b>", value)
    value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", lambda m: f"<i>{m.group(1)}</i>", value)
    for index, code in enumerate(code_spans):
        value = value.replace(f"EKOFINCODETOKEN{index}END", f'<font backColor="#F1F5F9">{code}</font>')
    return value.replace("  \n", "<br/>")


def _parse_table(lines: list[str], body_font: str, bold_font: str, width: float) -> Table:
    rows = []
    for index, line in enumerate(lines):
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if index == 1 and all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in cells):
            continue
        rows.append([Paragraph(_inline_markup(cell), ParagraphStyle(
            f"Table{index}", fontName=bold_font if index == 0 else body_font,
            fontSize=8.1, leading=11, textColor=INK if index == 0 else colors.HexColor("#344054"),
            spaceAfter=0,
        )) for cell in cells])
    if not rows:
        return Table([[]])
    col_count = max(len(row) for row in rows)
    for row in rows:
        row.extend([Paragraph("", ParagraphStyle("EmptyCell", fontName=body_font))] * (col_count - len(row)))
    table = Table(rows, colWidths=[width / col_count] * col_count, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def _extract_image_info(line: str) -> dict[str, str] | None:
    """Markdown satırından görsel bilgisini çıkartır (satır içi veya referans formatı)."""
    # 1. Satır içi markdown görseli: ![alt metni](uri/data)
    m = re.match(r"^!\[(.*?)\]\((.*?)\)\s*$", line)
    if m:
        return {"alt": m.group(1).strip(), "uri": m.group(2).strip()}
    # 2. Markdown referans görsel tanımı: [image1]: <data:image/...> veya [image1]: data:image/...
    m = re.match(r"^\[([a-zA-Z0-9_\-]+)\]:\s*<?(data:image\/[^>]+|[^\s>]+)>?\s*$", line)
    if m:
        return {"alt": m.group(1).strip(), "uri": m.group(2).strip()}
    return None


def _make_image_flowable(uri_or_path: str, max_width: float, max_height: float = 180) -> RLImage | None:
    """Data URI (base64) veya dosya yolundan ölçeklendirilmiş ReportLab Image üretir."""
    try:
        uri = uri_or_path.strip().strip("<>").strip()
        if uri.startswith("data:image/"):
            parts = uri.split(",", 1)
            if len(parts) != 2:
                return None
            img_bytes = base64.b64decode(parts[1].strip())
            buf = BytesIO(img_bytes)
            pil_img = PILImage.open(buf)
            orig_w, orig_h = pil_img.size
            if orig_w <= 0 or orig_h <= 0:
                return None
            scale = min(1.0, max_width / float(orig_w), max_height / float(orig_h))
            buf.seek(0)
            img = RLImage(buf, width=orig_w * scale, height=orig_h * scale)
            img.hAlign = "CENTER" if orig_w * scale > max_width * 0.5 else "LEFT"
            return img
        elif Path(uri).is_file():
            pil_img = PILImage.open(uri)
            orig_w, orig_h = pil_img.size
            scale = min(1.0, max_width / float(orig_w), max_height / float(orig_h))
            img = RLImage(uri, width=orig_w * scale, height=orig_h * scale)
            img.hAlign = "CENTER" if orig_w * scale > max_width * 0.5 else "LEFT"
            return img
    except Exception:
        pass
    return None


def _markdown_flowables(markdown: str, body_font: str, bold_font: str, width: float) -> list:
    styles = getSampleStyleSheet()
    p = ParagraphStyle("ReportBody", parent=styles["BodyText"], fontName=body_font,
                       fontSize=9.3, leading=14.2, textColor=colors.HexColor("#344054"),
                       alignment=TA_JUSTIFY, spaceAfter=8)
    heading_styles = {
        1: ParagraphStyle("ReportH1", fontName=bold_font, fontSize=18, leading=23, textColor=INK,
                          spaceBefore=15, spaceAfter=10, keepWithNext=True),
        2: ParagraphStyle("ReportH2", fontName=bold_font, fontSize=14, leading=18, textColor=EMERALD,
                          spaceBefore=13, spaceAfter=7, keepWithNext=True),
        3: ParagraphStyle("ReportH3", fontName=bold_font, fontSize=11, leading=15, textColor=INK,
                          spaceBefore=10, spaceAfter=5, keepWithNext=True),
        4: ParagraphStyle("ReportH4", fontName=bold_font, fontSize=10, leading=14, textColor=INK,
                          spaceBefore=8, spaceAfter=4, keepWithNext=True),
    }
    bullet = ParagraphStyle("ReportBullet", parent=p, leftIndent=13, firstLineIndent=-8,
                            bulletIndent=0, spaceAfter=4)
    blocks = []
    lines = markdown.replace("\r\n", "\n").split("\n")
    index = 0
    skipped_main_title = False
    while index < len(lines):
        raw = lines[index]
        stripped = raw.strip()
        if not stripped:
            index += 1
            continue
        if stripped.startswith("```"):
            code_lines = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(html.escape(lines[index]))
                index += 1
            blocks.append(Paragraph("<br/>".join(code_lines), ParagraphStyle(
                "ReportCode", fontName=body_font, fontSize=8, leading=11,
                backColor=colors.HexColor("#F5F7FA"), borderPadding=7, spaceAfter=9,
            )))
            index += 1
            continue
        if stripped.startswith("|") and index + 1 < len(lines) and lines[index + 1].strip().startswith("|"):
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            blocks.extend([Spacer(1, 3), _parse_table(table_lines, body_font, bold_font, width), Spacer(1, 9)])
            continue
        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            level = len(heading.group(1))
            title = heading.group(2).strip().strip("# ")
            if level == 1 and not skipped_main_title:
                skipped_main_title = True
            else:
                blocks.append(Paragraph(_inline_markup(title), heading_styles[level]))
            index += 1
            continue
        if re.fullmatch(r"[-*_]{3,}", stripped):
            blocks.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=4, spaceAfter=10))
            index += 1
            continue
        list_match = re.match(r"^\s*([-*+] |\d+[.)]\s+)(.+)$", raw)
        if list_match:
            marker, text = list_match.groups()
            bullet_text = "•" if marker[0].isdigit() else "•"
            blocks.append(Paragraph(f"{bullet_text} {_inline_markup(text)}", bullet))
            index += 1
            continue
        if stripped.startswith(">"):
            quote_lines = []
            while index < len(lines) and lines[index].strip().startswith(">"):
                quote_lines.append(lines[index].strip().lstrip("> "))
                index += 1
            quote_style = ParagraphStyle("ReportQuote", parent=p, leftIndent=10,
                                         borderColor=EMERALD, borderWidth=2, borderPadding=8,
                                         backColor=PALE, spaceAfter=9)
            blocks.append(Paragraph(_inline_markup(" ".join(quote_lines)), quote_style))
            continue

        # Görsel tanımları ([image1]: <data:...>) veya satır içi görseller (![alt](...))
        img_info = _extract_image_info(stripped)
        if img_info:
            img_list = []
            while index < len(lines):
                info = _extract_image_info(lines[index].strip())
                if not info:
                    break
                flowable = _make_image_flowable(info["uri"], width)
                if flowable:
                    img_list.append((info, flowable))
                index += 1

            small_batch = []
            for info, flowable in img_list:
                # Geniş görsel (> sayfa genişliğinin %40'ı) ise tek başına merkezde bas
                if flowable.drawWidth > width * 0.4:
                    if small_batch:
                        blocks.append(Spacer(1, 2 * mm))
                        blocks.append(Table([[f for _, f in small_batch]], hAlign="CENTER", style=[
                            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('LEFTPADDING', (0, 0), (-1, -1), 4),
                            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ]))
                        blocks.append(Spacer(1, 2 * mm))
                        small_batch = []
                    blocks.append(Spacer(1, 2 * mm))
                    blocks.append(flowable)
                    if info.get("alt") and not info["alt"].startswith("image"):
                        caption_style = ParagraphStyle("ImageCaption", parent=p, fontName=body_font,
                                                       fontSize=8, leading=10, textColor=MUTED,
                                                       alignment=TA_CENTER, spaceAfter=4)
                        blocks.append(Paragraph(_inline_markup(info["alt"]), caption_style))
                    blocks.append(Spacer(1, 3 * mm))
                else:
                    small_batch.append((info, flowable))

            # Arka arkaya gelen küçük mühür/rozet görsellerini yan yana tek satırda hizala
            if small_batch:
                blocks.append(Spacer(1, 2 * mm))
                total_w = sum(f.drawWidth for _, f in small_batch) + len(small_batch) * 8
                if total_w <= width:
                    tbl = Table([[f for _, f in small_batch]], hAlign="CENTER")
                    tbl.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ('TOPPADDING', (0, 0), (-1, -1), 2),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ]))
                    blocks.append(tbl)
                else:
                    for _, f in small_batch:
                        blocks.append(f)
                        blocks.append(Spacer(1, 2 * mm))
                blocks.append(Spacer(1, 3 * mm))
            continue

        paragraph_lines = [stripped]
        index += 1
        while index < len(lines):
            next_line = lines[index].strip()
            if (not next_line or next_line.startswith(("#", "|", ">", "```"))
                    or _extract_image_info(next_line) is not None
                    or re.match(r"^\s*([-*+] |\d+[.)]\s+)", lines[index])
                    or re.fullmatch(r"[-*_]{3,}", next_line)):
                break
            paragraph_lines.append(next_line)
            index += 1
        blocks.append(Paragraph(_inline_markup(" ".join(paragraph_lines)), p))
    return blocks


def _draw_chrome(canvas, doc, ticker: str, reporting_year: int, is_demo: bool = False) -> None:
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, height - 16 * mm, width - doc.rightMargin, height - 16 * mm)
        canvas.setFont(doc.body_font, 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, height - 12 * mm, f"EkoFin  /  {ticker}  /  TSRS {reporting_year}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 14 * mm, width - doc.rightMargin, 14 * mm)
    canvas.setFont(doc.body_font, 7.2)
    canvas.setFillColor(MUTED)
    footer_label = "SENTETİK DEMO • Gerçek şirket verisi değildir • KGK onayı/güvence değildir" if is_demo else "Otomatik oluşturulmuş rapor taslağı • Bağımsız güvence veya KGK onayı değildir"
    canvas.drawString(doc.leftMargin, 9 * mm, footer_label)
    canvas.drawRightString(width - doc.rightMargin, 9 * mm, f"{doc.page}")
    canvas.restoreState()


def create_report_pdf(*, markdown: str, ticker: str, reporting_year: int,
                      generated_at: str | None, content_hash: str | None,
                      validation_status: str | None, is_demo: bool = False) -> bytes:
    body_font, bold_font = _register_fonts()
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=19 * mm, leftMargin=19 * mm,
                            topMargin=23 * mm, bottomMargin=21 * mm,
                            title=f"{ticker} — TSRS {reporting_year} Sürdürülebilirlik Raporu",
                            author="EkoFin")
    doc.body_font = body_font
    width = A4[0] - doc.leftMargin - doc.rightMargin

    company_names = {
        "ASELS": "ASELSAN Elektronik Sanayi ve Ticaret A.Ş.",
        "TOASO": "Tofaş Türk Otomobil Fabrikası A.Ş.",
    }
    company_name = company_names.get(ticker.upper(), ticker.upper())
    validation_label = (
        "SENTETİK DEMO • gerçek şirket verisi değildir" if is_demo else
        "Otomatik kalite kontrolü geçti" if validation_status == "passed" else
        "Taslak • otomatik doğrulama durumu belirtilmemiş"
    )
    cover_title = ParagraphStyle("CoverTitle", fontName=bold_font, fontSize=25, leading=32,
                                 textColor=INK, alignment=TA_LEFT, spaceAfter=11)
    cover_company = ParagraphStyle("CoverCompany", fontName=bold_font, fontSize=14, leading=20,
                                   textColor=EMERALD, spaceAfter=8)
    cover_subtitle = ParagraphStyle("CoverSubtitle", fontName=body_font, fontSize=11, leading=16,
                                    textColor=MUTED, spaceAfter=12)
    meta = ParagraphStyle("CoverMeta", fontName=body_font, fontSize=9.5, leading=15,
                          textColor=INK, spaceAfter=4)

    story = [Spacer(1, 31 * mm),
             Paragraph("E K O F I N   /   S Ü R D Ü R Ü L E B İ L İ R L İ K", ParagraphStyle(
                 "Brand", fontName=bold_font, fontSize=8.5, textColor=EMERALD, spaceAfter=16)),
             HRFlowable(width="28%", thickness=3, color=EMERALD, hAlign="LEFT", spaceAfter=22),
             Paragraph("TSRS Sürdürülebilirlik<br/>Raporu", cover_title),
             Paragraph(company_name, cover_company),
             Paragraph(f"TSRS 1 ve TSRS 2 • {reporting_year} raporlama dönemi", cover_subtitle),
             Spacer(1, 13 * mm)]
    published_label = "—"
    if generated_at:
        try:
            published_label = datetime.fromisoformat(generated_at.replace("Z", "+00:00")).strftime("%d.%m.%Y %H:%M %Z").strip()
        except ValueError:
            published_label = generated_at
    metadata_rows = [
        [Paragraph("RAPORLAMA DÖNEMİ", meta), Paragraph(str(reporting_year), meta)],
        [Paragraph("ŞİRKET KODU", meta), Paragraph(ticker.upper(), meta)],
        [Paragraph("RAPOR DURUMU", meta), Paragraph(_inline_markup(validation_label), meta)],
        [Paragraph("OLUŞTURULMA", meta), Paragraph(html.escape(published_label), meta)],
    ]
    if content_hash:
        metadata_rows.append([Paragraph("İÇERİK SHA-256", meta), Paragraph(html.escape(content_hash),
                                                                           ParagraphStyle("Hash", parent=meta, fontSize=7.4, leading=10))])
    metadata_table = Table(metadata_rows, colWidths=[width * 0.34, width * 0.66], hAlign="LEFT")
    metadata_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([metadata_table, Spacer(1, 14 * mm),
                  Paragraph("Bu doküman, kaynak belgelerden otomatik olarak derlenmiş bir TSRS rapor taslağıdır. Resmî bildirim, bağımsız denetim/güvence veya KGK onayı yerine geçmez; yayımdan önce şirket yetkililerince gözden geçirilmelidir.",
                            ParagraphStyle("Disclaimer", fontName=body_font, fontSize=8.3, leading=12,
                                           textColor=MUTED, backColor=colors.HexColor("#F8FAFC"),
                                           borderColor=LINE, borderWidth=0.5, borderPadding=9)),
                  PageBreak()])
    story.extend(_markdown_flowables(markdown, body_font, bold_font, width))
    doc.build(story, onFirstPage=lambda canvas, doc: _draw_chrome(canvas, doc, ticker, reporting_year, is_demo),
              onLaterPages=lambda canvas, doc: _draw_chrome(canvas, doc, ticker, reporting_year, is_demo))
    return buffer.getvalue()

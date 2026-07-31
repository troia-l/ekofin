import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

// Genel amaçlı, prop-driven TSRS uyarı kutusu bileşeni.
// `warnings`: [{ level: 'info' | 'warning' | 'danger', title?, text }]
// Metinler backend/rapor-analiz tarafından (Atagün) sağlanacak; burada sadece
// bileşen ve makul bir varsayılan içerik var, böylece entegrasyon olmadan da
// sayfa boş görünmüyor.
const LEVEL_STYLES = {
  info: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', color: '#1D4ED8', Icon: Info },
  warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', color: '#B45309', Icon: AlertTriangle },
  danger: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', color: '#B91C1C', Icon: ShieldAlert },
};

const DEFAULT_WARNINGS = [
  {
    level: 'info',
    title: 'TSRS Uyum Notu',
    text: 'Bu rapor KGK TSRS-1 ve TSRS-2 standartları çerçevesinde otomatik olarak üretilmiştir; bağımsız denetim öncesi ön değerlendirme niteliğindedir.',
  },
  {
    level: 'warning',
    title: 'Veri Kaynağı Uyarısı',
    text: 'Rapordaki nicel veriler, KOBİ tarafından yüklenen belgelere ve yönetici beyanına dayanmaktadır; kritik kararlar öncesi kaynak belgelerin bağımsız olarak teyit edilmesi önerilir.',
  },
];

const TsrsWarningBox = ({ warnings, title = 'TSRS Rapor Uyarıları' }) => {
  const items = (warnings && warnings.length > 0) ? warnings : DEFAULT_WARNINGS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {title && (
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
      )}
      {items.map((w, idx) => {
        const style = LEVEL_STYLES[w.level] || LEVEL_STYLES.info;
        const { Icon } = style;
        return (
          <div
            key={idx}
            style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: '12px',
              background: style.bg, border: `1px solid ${style.border}`,
            }}
          >
            <Icon size={16} color={style.color} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              {w.title && (
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: style.color, marginBottom: '2px' }}>{w.title}</div>
              )}
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>{w.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TsrsWarningBox;

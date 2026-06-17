import React from 'react';
import { ChevronRight } from 'lucide-react';

const HighlightCard = ({ title, desc, link }) => (
    <div className="clean-card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{desc}</p>
        <div className="flex items-center gap-1" style={{ color: '#FF7F00', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
            {link} <ChevronRight size={16} />
        </div>
    </div>
);

export default HighlightCard;

import React from 'react';
import { ShieldCheck } from 'lucide-react';

const EsgBadge = ({ score }) => {
    const isHigh = score >= 8;
    return (
        <div className="badge badge-esg flex items-center gap-2" style={{
            background: isHigh ? 'var(--accent-green-bg)' : 'rgba(255, 127, 0, 0.05)',
            color: isHigh ? 'var(--primary)' : '#FF7F00',
            borderColor: isHigh ? 'var(--accent-green-border)' : 'rgba(255, 127, 0, 0.2)',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: '700'
        }}>
            <ShieldCheck size={14} />
            <span>YZ ANALİZİ: {score}/10</span>
        </div>
    );
};

export default EsgBadge;

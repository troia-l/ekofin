import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const Header = () => (
    <header style={{
        borderBottom: '1px solid var(--border-color)',
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
        padding: '16px 0'
    }}>
        <div className="container flex justify-between items-center">
            <NavLink to="/" style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <img src="./ecofin_logo.png" alt="EcoFin" style={{ height: '36px', width: 'auto' }} />
                    <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        <span style={{ color: 'var(--primary)' }}>Eco</span><span style={{ color: '#FF7F00' }}>Fin</span>
                    </span>
                </div>
            </NavLink>
            <nav style={{ display: 'flex', gap: '32px', fontWeight: 600, fontSize: '15px' }}>
                <NavLink to="/corporate" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none' })}>Kurumsal</NavLink>
                <NavLink to="/credits" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none' })}>Krediler</NavLink>
                <NavLink to="/crowdfunding" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none' })}>Kitle Fonlaması</NavLink>
                <NavLink to="/esg-report" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', textDecoration: 'none' })}>Y.Z. ESG Raporu</NavLink>
                <NavLink to="/public-audit" style={({ isActive }) => ({ color: isActive ? '#EF4444' : 'var(--text-muted)', textDecoration: 'none' })}>Toplumsal Denetim</NavLink>
            </nav>
            <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="btn btn-outline" style={{ padding: '8px 20px', borderRadius: '4px' }}>Dashboard</button>
            </NavLink>
        </div>
    </header>
);

export default Header;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, User } from 'lucide-react';

const Header = ({ currentUser, setCurrentUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        navigate('/');
    };

    return (
        <header className="public-header" style={{
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

                {currentUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', background: '#F1F5F9', padding: '6px 12px', borderRadius: '20px' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span>{currentUser.companyName.split(' ')[0]} ({currentUser.userName.split(' ')[0]})</span>
                        </div>
                        <NavLink to={currentUser.role === 'bank' ? '/bank/dashboard' : '/dashboard'} data-jury-tour-target="entry" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}>
                                Panel
                            </button>
                        </NavLink>
                        <button 
                            onClick={handleLogout}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--danger)', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                fontWeight: 600
                            }}
                            title="Çıkış Yap"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <NavLink to="/login" data-jury-tour-target="entry" style={{ textDecoration: 'none' }}>
                        <button className="btn btn-outline" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>Giriş Yap</button>
                    </NavLink>
                )}
            </div>
        </header>
    );
};

export default Header;

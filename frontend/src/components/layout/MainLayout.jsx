import React from 'react';
import Sidebar from './Sidebar';
import Topnav from './Topnav';

const MainLayout = ({ children, activePortal, setActivePortal }) => {
  return (
    <div className="app-container">
      <Sidebar activePortal={activePortal} />
      <div className="main-content">
        <Topnav activePortal={activePortal} setActivePortal={setActivePortal} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

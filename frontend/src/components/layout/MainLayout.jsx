import React from 'react';
import Sidebar from './Sidebar';
import Topnav from './Topnav';

const MainLayout = ({ children, activePortal, setActivePortal, currentUser, setCurrentUser }) => {
  return (
    <div className="app-container">
      <Sidebar activePortal={activePortal} currentUser={currentUser} />
      <div className="main-content">
        <Topnav 
          activePortal={activePortal} 
          setActivePortal={setActivePortal} 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
        />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

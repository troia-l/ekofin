import React from 'react';
import Sidebar from './Sidebar';
import Topnav from './Topnav';
import AssistantChat from '../AssistantChat';

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
      <AssistantChat key={`${currentUser?.role}:${currentUser?.companyTicker}`} currentUser={currentUser} />
    </div>
  );
};

export default MainLayout;

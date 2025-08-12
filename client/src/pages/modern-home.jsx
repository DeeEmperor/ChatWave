import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, BarChart3, Settings, Activity } from 'lucide-react';
import QRCodeBox from '../components/QRCodeBox';
import ComposeCard from '../components/ComposeCard';
import ChatWindow from '../components/ChatWindow';
import chatwaveIcon from '../chatwaveIcon.png';

export default function ModernHome() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    messagesSent: 0,
    deliveryRate: 0
  });
  const [delaySetting, setDelaySetting] = useState(() => {
    const v = parseInt(localStorage.getItem('sendDelay') || '6', 10);
    return [6,7,8].includes(v) ? v : 6;
  });

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(prev => ({
      ...prev,
      ...newStats
    }));
  }, []);
  return (
    <div className="cw-app">
      {/* Header with glassmorphism */}
      <header className="cw-header">
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={chatwaveIcon} 
                alt="ChatWave" 
                style={{ height: 40, width: 'auto', objectFit: 'contain', borderRadius: 8 }} 
                draggable={false}
              />
            </div>
            <div>
              <h1 style={{ 
                fontSize: 'var(--font-heading-size)', 
                fontWeight: 700, 
                color: 'var(--text-heading)', 
                margin: 0 
              }}>
                ChatWave
              </h1>
              <p style={{ 
                color: 'var(--text-muted)', 
                margin: 0, 
                fontSize: '0.875rem' 
              }}>
                Professional WhatsApp Bulk Messaging
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              padding: '8px 16px',
              borderRadius: '50px',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Activity size={16} />
              System Online
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="cw-main-layout">
        <div className="cw-content">
          {/* Main compose area */}
          <ComposeCard onStatsUpdate={handleStatsUpdate} />
          
          {/* Statistics cards */}
          <div className="cw-stats">
            <div className="cw-stat-card cw-fade-in-up">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '12px' 
              }}>
                <Users size={24} style={{ color: 'var(--text-heading)' }} />
              </div>
              <h3 className="cw-stat-number">{stats.totalContacts.toLocaleString()}</h3>
              <p className="cw-stat-label">Total Contacts</p>
            </div>
            
            <div className="cw-stat-card cw-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '12px' 
              }}>
                <MessageSquare size={24} style={{ color: 'var(--text-heading)' }} />
              </div>
              <h3 className="cw-stat-number">{stats.messagesSent.toLocaleString()}</h3>
              <p className="cw-stat-label">Messages Sent</p>
            </div>
            
            <div className="cw-stat-card cw-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '12px' 
              }}>
                <BarChart3 size={24} style={{ color: 'var(--text-heading)' }} />
              </div>
              <h3 className="cw-stat-number">{stats.deliveryRate > 0 ? `${stats.deliveryRate.toFixed(1)}%` : '0%'}</h3>
              <p className="cw-stat-label">Delivery Rate</p>
            </div>
          </div>
          
          {/* Chat preview */}
          <ChatWindow />
        </div>

        {/* Sidebar with QR code */}
        <div className="cw-sidebar">
          <QRCodeBox />
          
          {/* Quick settings */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ 
              color: 'var(--text-heading)', 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              marginBottom: '16px' 
            }}>
              Quick Settings
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: 'var(--text-body)', fontSize: '0.875rem' }}>
                  Auto Retry Failed Messages
                </span>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  style={{ 
                    accentColor: '#ff7eb3',
                    width: '16px',
                    height: '16px'
                  }} 
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: 'var(--text-body)', fontSize: '0.875rem' }}>
                  Delivery Reports
                </span>
                <input 
                  type="checkbox" 
                  style={{ 
                    accentColor: '#ff7eb3',
                    width: '16px',
                    height: '16px'
                  }} 
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <span style={{ color: 'var(--text-body)', fontSize: '0.875rem' }}>
                  Delay Between Messages
                </span>
                <select 
                  value={delaySetting}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setDelaySetting(v);
                    localStorage.setItem('sendDelay', String(v));
                    window.dispatchEvent(new Event('sendDelayChanged'));
                  }}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: 'var(--text-body)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="6">6 sec</option>
                  <option value="7">7 sec</option>
                  <option value="8">8 sec</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="cw-footer">
        <p style={{ margin: 0 }}>
          © 2024 ChatWave. Professional WhatsApp messaging solution.
        </p>
      </footer>
    </div>
  );
}

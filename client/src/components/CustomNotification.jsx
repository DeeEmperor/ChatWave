import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, QrCode, Wifi, X } from 'lucide-react';

const notificationIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  qr: QrCode,
  connection: Wifi,
};

const getIconByTitle = (title) => {
  if (title?.includes('QR Code') || title?.includes('QR')) return notificationIcons.qr;
  if (title?.includes('Connected') || title?.includes('Connection')) return notificationIcons.connection;
  return notificationIcons.info;
};

const CustomNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - 2; // Decrease by 2% every 100ms
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const Icon = getIconByTitle(notification.title) || notificationIcons[notification.variant] || notificationIcons.info;

  const getVariantStyles = () => {
    switch (notification.variant) {
      case 'success':
        return {
          borderColor: 'rgba(16, 185, 129, 0.3)',
          iconColor: '#10B981',
          progressColor: '#10B981'
        };
      case 'error':
      case 'destructive':
        return {
          borderColor: 'rgba(239, 68, 68, 0.3)',
          iconColor: '#EF4444',
          progressColor: '#EF4444'
        };
      case 'warning':
        return {
          borderColor: 'rgba(245, 158, 11, 0.3)',
          iconColor: '#F59E0B',
          progressColor: '#F59E0B'
        };
      default:
        return {
          borderColor: 'rgba(59, 130, 246, 0.3)',
          iconColor: '#3B82F6',
          progressColor: '#3B82F6'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`cw-notification ${isVisible ? 'cw-notification-visible' : ''}`}
      style={{
        borderColor: styles.borderColor,
      }}
    >
      <div className="cw-notification-content">
        <div 
          className="cw-notification-icon"
          style={{ color: styles.iconColor }}
        >
          <Icon size={20} />
        </div>
        <div className="cw-notification-text">
          <div className="cw-notification-title">{notification.title}</div>
          {notification.description && (
            <div className="cw-notification-description">{notification.description}</div>
          )}
        </div>
        <button 
          className="cw-notification-close"
          onClick={handleClose}
        >
          <X size={16} />
        </button>
      </div>
      <div 
        className="cw-notification-progress"
        style={{
          width: `${progress}%`,
          backgroundColor: styles.progressColor
        }}
      />
    </div>
  );
};

export default CustomNotification;

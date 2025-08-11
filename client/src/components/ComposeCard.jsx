import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, FileText, Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ComposeCard({ onStatsUpdate }) {
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState('numbers'); // 'numbers' or 'csv'
  const [sendingProgress, setSendingProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [csvData, setCsvData] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef(null);

  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;
    if (inputMethod === 'numbers' && !phoneNumbers.trim()) return;

    const tokens = inputMethod === 'numbers'
      ? phoneNumbers.split(/[\n,]+/)
      : [];

    const contacts = tokens
      .map(l => l.trim())
      .filter(Boolean)
      .map(formatPhoneNumber)
      .filter(isValidPhoneNumber);

    if (contacts.length === 0) {
      toast({ title: 'No valid recipients', description: 'Please add valid phone numbers', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/send', {
        content: message,
        delay: 6,
        phoneNumbers: contacts,
      });

      toast({ title: 'Messages queued', description: `${contacts.length} message(s) queued.` });
      if (res?.messageId) {
        localStorage.setItem('latestMessageId', String(res.messageId));
        localStorage.setItem('campaignStartTime', String(Date.now()));
        setSendingProgress({ sent: 0, failed: 0, total: contacts.length });
      }

      // optional: inform parent to update stats baseline
      if (onStatsUpdate) onStatsUpdate({ messagesSent: 0, deliveryRate: 0 });

      setMessage('');
      setPhoneNumbers('');
    } catch (e) {
      toast({ title: 'Failed to queue', description: e?.message || 'Request failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Phone number formatting - digits only output for WhatsApp
  const formatPhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return '';
    
    // Remove all non-numeric characters (spaces, parentheses, dashes, plus signs, etc.)
    let cleaned = number.replace(/[^\d]/g, '');
    
    // If empty after cleaning, return empty
    if (!cleaned) return '';
    
    // If starts with 0 (local number), replace with Nigeria country code (234)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    }
    
    // Return only digits (no + sign)
    return cleaned;
  };

  // Validate if a number is a valid phone number (10-15 digits)
  const isValidPhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return false;
    const cleaned = number.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  // Poll status for latest message to update progress and parent stats
  useEffect(() => {
    let timer;
    const poll = async () => {
      const id = localStorage.getItem('latestMessageId');
      if (!id) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') ? 'http://localhost:5000' : 'https://chatwave-64p3.onrender.com')}/api/message/${id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        const total = data?.progress?.total || 0;
        const sent = data?.progress?.sent || 0;
        const failed = data?.progress?.failed || 0;
        setSendingProgress({ total, sent, failed });
        if (onStatsUpdate && total > 0) {
          const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
          onStatsUpdate({ messagesSent: sent, deliveryRate });
        }
        // stop polling when completed
        if (total > 0 && sent + failed >= total) {
          clearInterval(timer);
        }
      } catch {}
    };
    timer = setInterval(poll, 2000);
    poll();
    return () => clearInterval(timer);
  }, [onStatsUpdate]);

  // Handle phone number input changes (supports commas or newlines)
  const handlePhoneNumbersChange = (value) => {
  setPhoneNumbers(value);
  };
  
  // Auto-format on blur: split by comma/newline, apply rules, join by newline
  const handlePhoneNumbersBlur = () => {
  const tokens = phoneNumbers
    .split(/[\n,]+/)
  .map(t => t.trim())
  .filter(Boolean);

  const formatted = tokens
  .map(formatPhoneNumber)
    .filter(isValidPhoneNumber);

  setPhoneNumbers(formatted.join('\n'));
  };

  // Handle CSV file upload
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find phone column (look for 'phone', 'number', 'mobile', etc.)
      const phoneColumnIndex = headers.findIndex(h => 
        h.includes('phone') || h.includes('number') || h.includes('mobile') || h.includes('tel')
      );
      
      if (phoneColumnIndex === -1) {
        alert('Could not find a phone number column. Please make sure your CSV has a column named "phone", "number", "mobile", or "tel".');
        return;
      }
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const columns = line.split(',');
          const originalPhone = columns[phoneColumnIndex]?.trim() || '';
          const formattedPhone = formatPhoneNumber(originalPhone);
          
          return {
            id: index,
            original: originalPhone,
            formatted: formattedPhone,
            isValid: isValidPhoneNumber(formattedPhone)
          };
        })
        .filter(item => item.original); // Remove empty rows
      
      setCsvData(data);
    };
    
    reader.readAsText(file);
  };

  // Clear CSV data
  const clearCSV = () => {
    setCsvData([]);
    setCsvFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getContactCount = () => {
    if (inputMethod === 'numbers' && phoneNumbers) {
      const numbers = phoneNumbers.split('\n').filter(num => num.trim() && isValidPhoneNumber(formatPhoneNumber(num.trim())));
      return numbers.length;
    }
    if (inputMethod === 'csv') {
      return csvData.filter(item => item.isValid).length;
    }
    return 0;
  };

  // Get formatted preview of phone numbers
  const getFormattedPreview = () => {
    if (!phoneNumbers) return [];
    return phoneNumbers.split('\n')
      .filter(line => line.trim())
      .map(line => ({
        original: line.trim(),
        formatted: formatPhoneNumber(line.trim()),
        isValid: isValidPhoneNumber(formatPhoneNumber(line.trim()))
      }));
  };

  const getValidationInfo = () => {
    if (inputMethod === 'numbers' && phoneNumbers) {
      const allLines = phoneNumbers.split('\n').filter(line => line.trim());
      const validNumbers = allLines.filter(line => isValidPhoneNumber(formatPhoneNumber(line.trim())));
      const invalidNumbers = allLines.filter(line => line.trim() && !isValidPhoneNumber(formatPhoneNumber(line.trim())));
      
      return {
        total: allLines.length,
        valid: validNumbers.length,
        invalid: invalidNumbers.length
      };
    }
    return { total: 0, valid: 0, invalid: 0 };
  };

  // Update total contacts whenever phone numbers change
  useEffect(() => {
    const contactCount = getContactCount();
    if (onStatsUpdate) {
      onStatsUpdate({ totalContacts: contactCount });
    }
  }, [phoneNumbers, inputMethod, csvData]); // Remove onStatsUpdate from dependencies

  return (
    <div className="cw-compose cw-fade-in-up">
      <div className="cw-compose-header">
        <div className="cw-compose-icon">
          <MessageCircle size={24} />
        </div>
        <div>
          <h2 className="cw-card-title">Compose Message</h2>
          <p className="cw-card-subtitle">Send your message to multiple contacts</p>
        </div>
      </div>

      <div className="cw-flex cw-flex-col cw-gap-lg" style={{ flex: 1 }}>
        <div>
          <label htmlFor="recipients" className="cw-mb-sm" style={{ 
            display: 'block', 
            fontWeight: 600, 
            color: 'var(--text-heading)',
            marginBottom: '12px'
          }}>
            Recipients
          </label>
          
          {/* Input method toggle */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50px',
            padding: '4px'
          }}>
            <button
              onClick={() => setInputMethod('numbers')}
              style={{
                background: inputMethod === 'numbers' ? 'var(--accent-gradient)' : 'transparent',
                color: inputMethod === 'numbers' ? 'white' : 'var(--text-body)',
                border: 'none',
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                flex: 1
              }}
            >
              Phone Numbers
            </button>
            <button
              onClick={() => setInputMethod('csv')}
              style={{
                background: inputMethod === 'csv' ? 'var(--accent-gradient)' : 'transparent',
                color: inputMethod === 'csv' ? 'white' : 'var(--text-body)',
                border: 'none',
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                flex: 1
              }}
            >
              CSV Upload
            </button>
          </div>

          {inputMethod === 'numbers' ? (
            <div>
              <textarea
                value={phoneNumbers}
                onChange={(e) => handlePhoneNumbersChange(e.target.value)}
                onBlur={handlePhoneNumbersBlur}
                placeholder="Enter phone numbers (one per line)"
                className="cw-input"
                rows={4}
                style={{ 
                  marginBottom: '12px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              />


              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginBottom: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ marginBottom: '4px', fontWeight: 600, color: 'var(--text-heading)' }}>
                  📋 Auto-formatting Rules:
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                  • Numbers starting with 0 → Nigerian format (0803... → 2348031234567)
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                  • Removes all spaces, parentheses, dashes, plus signs
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                  • Output: digits only (10-15 digits)
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9, fontStyle: 'italic', marginTop: '4px' }}>
                  💡 Click outside the input box to auto-format your numbers
                </div>
              </div>
              
              {/* Validation feedback */}
              {phoneNumbers && (
                <div style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  background: getValidationInfo().invalid > 0 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${getValidationInfo().invalid > 0 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : 'rgba(16, 185, 129, 0.3)'}`,
                  color: getValidationInfo().invalid > 0 
                    ? '#EF4444' 
                    : '#10B981'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    📊 Validation Results:
                  </div>
                  <div>
                    ✅ {getValidationInfo().valid} valid numbers
                    {getValidationInfo().invalid > 0 && (
                      <span style={{ marginLeft: '12px' }}>
                        ❌ {getValidationInfo().invalid} invalid/incomplete
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
              
              {!csvFileName ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="cw-btn cw-btn-secondary" 
                  style={{ width: '100%' }}
                >
                  <Upload size={16} />
                  Choose CSV File
                </button>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{csvFileName}</span>
                    </div>
                    <button 
                      onClick={clearCSV}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {csvData.length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-heading)',
                        marginBottom: '8px'
                      }}>
                        📊 Preview ({csvData.length} numbers found):
                      </div>
                      
                      <div style={{ 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px',
                        padding: '8px'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr auto', 
                          gap: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                          padding: '4px 8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div>Original</div>
                          <div>Formatted</div>
                          <div>Status</div>
                        </div>
                        
                        {csvData.slice(0, 20).map((item) => (
                          <div key={item.id} style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr auto', 
                            gap: '8px',
                            fontSize: '0.7rem',
                            marginBottom: '4px',
                            padding: '4px 8px',
                            background: item.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                          }}>
                            <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.original}
                            </div>
                            <div style={{ color: item.isValid ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                              {item.formatted}
                            </div>
                            <div>
                              {item.isValid ? '✅' : '❌'}
                            </div>
                          </div>
                        ))}
                        
                        {csvData.length > 20 && (
                          <div style={{ 
                            textAlign: 'center', 
                            marginTop: '8px', 
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem'
                          }}>
                            ... and {csvData.length - 20} more numbers
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>✅ {csvData.filter(item => item.isValid).length} valid</span>
                        <span>❌ {csvData.filter(item => !item.isValid).length} invalid</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                CSV should have a "phone", "number", "mobile", or "tel" column
              </p>
            </div>
          )}

          <div className="cw-flex cw-items-center cw-gap-xs" style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '8px 16px', 
            borderRadius: '50px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            justifyContent: 'center'
          }}>
            <Users size={16} style={{ color: '#10B981' }} />
            <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 500 }}>
              {getContactCount()} contacts ready
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <label htmlFor="message" className="cw-mb-sm" style={{ 
            display: 'block', 
            fontWeight: 600, 
            color: 'var(--text-heading)',
            marginBottom: '12px'
          }}>
            Your Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="cw-input cw-textarea"
            rows={8}
            style={{ resize: 'none', flex: 1 }}
          />
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)', 
            marginTop: '12px',
            textAlign: 'right' 
          }}>
            {message.length} characters • {Math.ceil(message.length / 160)} SMS{message.length > 160 ? 's' : ''}
          </p>
        </div>

        <div className="cw-flex cw-justify-between cw-items-center">
          <div className="cw-flex cw-gap-sm">
            <div className="cw-badge cw-badge-success" style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              padding: '6px 12px',
              borderRadius: '50px',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div className="w-2 h-2 bg-current rounded-full cw-pulse" style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10B981',
                borderRadius: '50%'
              }}></div>
              WhatsApp Connected
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || getContactCount() === 0}
            className="cw-btn cw-btn-primary cw-btn-lg"
          >
            {isLoading ? (
              <>
                <div className="cw-spinner"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send Messages
              </>
            )}
          </button>
        </div>

        {/* Progress indicator when sending */}
        {isLoading && (
          <div className="cw-status-panel cw-fade-in-up" style={{
            background: 'var(--card-bg)',
            backdropFilter: 'var(--blur-glass)',
            border: '1px solid rgba(255, 126, 179, 0.3)',
            borderLeft: '4px solid var(--accent-gradient)'
          }}>
            <div className="cw-flex cw-items-center cw-gap-md cw-mb-sm">
              <div className="cw-spinner"></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: '4px' }}>
                  Sending Messages...
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {sendingProgress.sent} of {sendingProgress.total} messages sent
                </div>
              </div>
              <div style={{ 
                background: 'rgba(255, 126, 179, 0.2)', 
                padding: '8px 16px', 
                borderRadius: '50px',
                color: '#ff7eb3',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {Math.round((sendingProgress.sent / sendingProgress.total) * 100)}%
              </div>
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                background: 'var(--accent-gradient)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
                width: `${(sendingProgress.sent / sendingProgress.total) * 100}%`
              }}></div>
            </div>
            
            {/* Current number being sent to */}
            {sendingProgress.currentNumber && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace'
              }}>
                📱 Sending to: {sendingProgress.currentNumber}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

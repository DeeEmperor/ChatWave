import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function UploadForm() {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Listen for phone numbers cleared event
  useEffect(() => {
    const handlePhoneNumbersCleared = () => {
      setPhoneNumbers([]);
      setManualInput('');
    };

    window.addEventListener('phoneNumbersCleared', handlePhoneNumbersCleared);
    return () => {
      window.removeEventListener('phoneNumbersCleared', handlePhoneNumbersCleared);
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPhoneNumbers(data.phoneNumbers);
      localStorage.setItem('phoneNumbers', JSON.stringify(data.phoneNumbers));
      toast({
        title: "CSV Uploaded",
        description: `Successfully processed ${data.count} phone numbers`,
      });
    },
    onError: () => {
      toast({
        title: "Upload Error",
        description: "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('csvFile', file);
      uploadMutation.mutate(formData);
    }
  };

  const handleManualInputBlur = () => {
    if (!manualInput.trim()) return;

    // Parse phone numbers from manual input
    const numbers = manualInput
      .split(/[,\n\r]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0)
      .map(num => num.startsWith('+') ? num : `+${num}`);

    setPhoneNumbers(numbers);
    localStorage.setItem('phoneNumbers', JSON.stringify(numbers));
    
    toast({
      title: "Numbers Processed",
      description: `Parsed ${numbers.length} phone numbers`,
    });
  };



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <i className="fas fa-phone text-amber-600"></i>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Phone Numbers</h2>
      </div>

      <div className="space-y-6">
        {/* CSV File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Upload CSV File</label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-gray-400 text-xl"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">CSV files only. Phone numbers should be in first column.</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>
          {uploadMutation.isPending && (
            <p className="text-sm text-blue-600 mt-2">Uploading and processing...</p>
          )}
        </div>

        {/* Manual Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Or Paste Numbers Manually</label>
          <textarea 
            rows="8" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp focus:border-transparent resize-none transition-all duration-200" 
            placeholder="Paste phone numbers here (one per line or comma separated)&#10;Example:&#10;+1234567890&#10;+9876543210&#10;Or: +1234567890, +9876543210, +5555555555"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onBlur={handleManualInputBlur}
          />
          <p className="text-xs text-gray-500 mt-2">Numbers will be automatically converted to CSV format when you click elsewhere</p>
        </div>

        {/* Phone Numbers Summary */}
        {phoneNumbers.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Numbers Ready</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {phoneNumbers.length} numbers
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Upload, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Download
} from 'lucide-react';

export default function UploadForm() {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Load existing phone numbers on mount
  useEffect(() => {
    const savedNumbers = JSON.parse(localStorage.getItem('phoneNumbers') || '[]');
    setPhoneNumbers(savedNumbers);
  }, []);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPhoneNumbers(data.phoneNumbers);
      localStorage.setItem('phoneNumbers', JSON.stringify(data.phoneNumbers));
      toast({
        title: "CSV Successfully Processed!",
        description: `Imported ${data.count} valid phone numbers`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file only",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);
    uploadMutation.mutate(formData);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleManualAdd = () => {
    if (!manualInput.trim()) {
      toast({
        title: "No Numbers Entered",
        description: "Please enter phone numbers first",
        variant: "destructive",
      });
      return;
    }

    // Parse phone numbers from manual input
    const numbers = manualInput
      .split(/[,\n\r\t;]+/)
      .map(num => num.trim().replace(/\s+/g, ''))
      .filter(num => num.length > 0)
      .map(num => {
        // Add + if not present
        if (!num.startsWith('+')) {
          return `+${num}`;
        }
        return num;
      })
      .filter(num => {
        // Basic validation - should have + and at least 10 digits
        const digits = num.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      });

    if (numbers.length === 0) {
      toast({
        title: "No Valid Numbers",
        description: "Please check your phone number format",
        variant: "destructive",
      });
      return;
    }

    // Combine with existing numbers and remove duplicates
    const combined = [...new Set([...phoneNumbers, ...numbers])];
    setPhoneNumbers(combined);
    localStorage.setItem('phoneNumbers', JSON.stringify(combined));
    setManualInput('');
    
    toast({
      title: "Numbers Added Successfully!",
      description: `Added ${numbers.length} valid phone numbers`,
    });
  };

  const removeNumber = (indexToRemove) => {
    const updated = phoneNumbers.filter((_, index) => index !== indexToRemove);
    setPhoneNumbers(updated);
    localStorage.setItem('phoneNumbers', JSON.stringify(updated));
    
    toast({
      title: "Number Removed",
      description: "Phone number has been removed from the list",
    });
  };

  const clearAllNumbers = () => {
    setPhoneNumbers([]);
    setManualInput('');
    localStorage.removeItem('phoneNumbers');
    
    toast({
      title: "All Numbers Cleared",
      description: "Phone number list has been reset",
    });
  };

  const exportNumbers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + phoneNumbers.map(num => num.replace('+', '')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "phone_numbers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20 shadow-xl shadow-amber-500/10 border-amber-200/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots-pattern opacity-[0.03]"></div>
      <div className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-amber-600" />
          </div>
          Phone Numbers
        </CardTitle>
        {phoneNumbers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {phoneNumbers.length} contact{phoneNumbers.length !== 1 ? 's' : ''} ready
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Validated & formatted
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* CSV File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload CSV File
          </label>
          <div 
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
              ${dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : uploadMutation.isPending 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-3">
              <div className={`w-12 h-12 rounded-lg mx-auto flex items-center justify-center ${
                dragActive ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {uploadMutation.isPending ? (
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                ) : (
                  <Upload className={`w-6 h-6 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {uploadMutation.isPending 
                    ? 'Processing CSV file...' 
                    : dragActive 
                      ? 'Drop your CSV file here' 
                      : 'Click to upload or drag and drop'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  CSV files only • Phone numbers in first column
                </p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">OR</span>
          <Separator className="flex-1" />
        </div>

        {/* Manual Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Numbers Manually
          </label>
          <Textarea 
            placeholder="Enter phone numbers here...&#10;&#10;Formats supported:&#10;• +1234567890&#10;• +1234567890, +9876543210&#10;• One per line or comma separated"
            className="min-h-[100px] text-sm"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleManualAdd}
              disabled={!manualInput.trim()}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Numbers
            </Button>
            {manualInput.trim() && (
              <Button 
                variant="outline" 
                onClick={() => setManualInput('')}
                size="sm"
              >
                Clear Input
              </Button>
            )}
          </div>
        </div>

        {/* Phone Numbers Display */}
        {phoneNumbers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Ready to Send ({phoneNumbers.length} contact{phoneNumbers.length !== 1 ? 's' : ''})
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportNumbers}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllNumbers}>
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {phoneNumbers.slice(0, 9).map((number, index) => (
                    <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded text-sm">
                      <span className="font-mono text-gray-700">{number}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNumber(index)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {phoneNumbers.length > 9 && (
                    <div className="flex items-center justify-center bg-gray-100 px-3 py-2 rounded text-sm text-gray-500">
                      +{phoneNumbers.length - 9} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {phoneNumbers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium mb-1">No contacts added yet</p>
            <p className="text-xs">Upload a CSV file or add numbers manually to get started</p>
          </div>
        )}
      </CardContent>
      </div>
    </Card>
  );
}

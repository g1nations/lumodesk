import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Key, Eye, EyeOff, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { API_KEY_STORAGE_KEY } from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';

interface ApiKeySettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export default function ApiKeySettings({ apiKey, setApiKey }: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey);
  const { toast } = useToast();

  // Update input value when apiKey prop changes
  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  const saveApiKey = () => {
    const key = inputValue.trim();
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
      toast({
        title: 'Success',
        description: 'API key saved successfully',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid API key',
        variant: 'destructive',
      });
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setInputValue('');
    setApiKey('');
    toast({
      title: 'API Key Cleared',
      description: 'Your API key has been removed',
      duration: 3000,
    });
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger className="flex items-center text-sm font-medium text-gray-600 cursor-pointer hover:text-[#FF0000] w-full">
          <Key className="w-4 h-4 mr-2" />
          <span>YouTube API Key Settings</span>
          {isOpen ? <ChevronUp className="ml-auto w-4 h-4" /> : <ChevronDown className="ml-auto w-4 h-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 bg-gray-50 p-4 rounded-lg">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
            Your YouTube Data API Key
          </label>
          <div className="flex">
            <Input
              id="api-key-input"
              type={showKey ? 'text' : 'password'}
              placeholder="Enter your YouTube Data API key"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#FF0000] focus:border-[#FF0000]"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 border-l-0 rounded-r-lg"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="mt-3 flex justify-between">
            <Button
              onClick={saveApiKey}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
            >
              <Save className="w-4 h-4 mr-1" /> Save Key
            </Button>
            <Button
              onClick={clearApiKey}
              variant="secondary"
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear Key
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-700 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              How to get an API Key:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project</li>
              <li>Enable YouTube Data API v3</li>
              <li>Create credentials (API Key)</li>
              <li>Copy and paste the key above</li>
            </ol>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

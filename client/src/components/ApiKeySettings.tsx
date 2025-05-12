import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Key, Eye, EyeOff, Save, Trash2, ChevronDown, ChevronUp, Bot, Settings2 } from 'lucide-react';
import { 
  API_KEY_STORAGE_KEY, 
  QWQ_API_KEY_STORAGE_KEY, 
  AI_MODEL_STORAGE_KEY,
  DEFAULT_AI_MODEL 
} from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';

interface ApiKeySettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  qwqApiKey?: string;
  setQwqApiKey?: (key: string) => void;
  aiModel?: string;
  setAiModel?: (model: string) => void;
}

export default function ApiKeySettings({ 
  apiKey, 
  setApiKey,
  qwqApiKey = localStorage.getItem(QWQ_API_KEY_STORAGE_KEY) || '',
  setQwqApiKey = (key: string) => localStorage.setItem(QWQ_API_KEY_STORAGE_KEY, key),
  aiModel = localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL,
  setAiModel = (model: string) => localStorage.setItem(AI_MODEL_STORAGE_KEY, model)
}: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isQwqOpen, setIsQwqOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showQwqKey, setShowQwqKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey);
  const [qwqInputValue, setQwqInputValue] = useState(qwqApiKey);
  const [modelValue, setModelValue] = useState(aiModel);
  const { toast } = useToast();

  // Update input value when apiKey prop changes
  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  // Update QWQ input value when qwqApiKey changes
  useEffect(() => {
    setQwqInputValue(qwqApiKey);
  }, [qwqApiKey]);
  
  // Update model value when aiModel changes
  useEffect(() => {
    setModelValue(aiModel);
  }, [aiModel]);

  const saveApiKey = () => {
    const key = inputValue.trim();
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
      toast({
        title: 'Success',
        description: 'YouTube API key saved successfully',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid YouTube API key',
        variant: 'destructive',
      });
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setInputValue('');
    setApiKey('');
    toast({
      title: 'YouTube API Key Cleared',
      description: 'Your YouTube API key has been removed',
      duration: 3000,
    });
  };
  
  const saveQwqApiKey = () => {
    const key = qwqInputValue.trim();
    if (key) {
      localStorage.setItem(QWQ_API_KEY_STORAGE_KEY, key);
      if (setQwqApiKey) setQwqApiKey(key);
      toast({
        title: 'Success',
        description: 'OpenRouter API key saved successfully',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid OpenRouter API key',
        variant: 'destructive',
      });
    }
  };

  const clearQwqApiKey = () => {
    localStorage.removeItem(QWQ_API_KEY_STORAGE_KEY);
    setQwqInputValue('');
    if (setQwqApiKey) setQwqApiKey('');
    toast({
      title: 'OpenRouter API Key Cleared',
      description: 'Your OpenRouter API key has been removed',
      duration: 3000,
    });
  };
  
  const saveAiModel = (value: string) => {
    if (value) {
      localStorage.setItem(AI_MODEL_STORAGE_KEY, value);
      if (setAiModel) setAiModel(value);
      setModelValue(value);
      toast({
        title: 'AI Model Updated',
        description: `AI model changed to ${value}`,
        duration: 3000,
      });
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
      {/* YouTube API Key Settings */}
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
              How to get a YouTube API Key:
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
      
      {/* OpenRouter API Key Settings */}
      <Collapsible
        open={isQwqOpen}
        onOpenChange={setIsQwqOpen}
        className="w-full"
      >
        <CollapsibleTrigger className="flex items-center text-sm font-medium text-gray-600 cursor-pointer hover:text-[#FF0000] w-full">
          <Bot className="w-4 h-4 mr-2" />
          <span>OpenRouter API Key Settings</span>
          {isQwqOpen ? <ChevronUp className="ml-auto w-4 h-4" /> : <ChevronDown className="ml-auto w-4 h-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 bg-gray-50 p-4 rounded-lg">
          <label htmlFor="qwq-api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
            Your OpenRouter API Key (for QWQ-32B AI)
          </label>
          <div className="flex">
            <Input
              id="qwq-api-key-input"
              type={showQwqKey ? 'text' : 'password'}
              placeholder="Enter your OpenRouter API key"
              value={qwqInputValue}
              onChange={(e) => setQwqInputValue(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#FF0000] focus:border-[#FF0000]"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowQwqKey(!showQwqKey)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 border-l-0 rounded-r-lg"
            >
              {showQwqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="mt-3 flex justify-between">
            <Button
              onClick={saveQwqApiKey}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
            >
              <Save className="w-4 h-4 mr-1" /> Save Key
            </Button>
            <Button
              onClick={clearQwqApiKey}
              variant="secondary"
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear Key
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
            <p className="font-medium text-purple-700 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              How to get an OpenRouter API Key:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">OpenRouter API Keys</a></li>
              <li>Create an account or log in</li>
              <li>Create a new API key</li>
              <li>Copy and paste the key above</li>
            </ol>
            <p className="mt-2 text-purple-600">This API key is used for AI-powered SEO analysis and caption parodies using the selected AI model</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* AI Model Settings */}
      <Collapsible
        open={isModelOpen}
        onOpenChange={setIsModelOpen}
        className="w-full"
      >
        <CollapsibleTrigger className="flex items-center text-sm font-medium text-gray-600 cursor-pointer hover:text-[#FF0000] w-full">
          <Settings2 className="w-4 h-4 mr-2" />
          <span>AI Model Settings</span>
          {isModelOpen ? <ChevronUp className="ml-auto w-4 h-4" /> : <ChevronDown className="ml-auto w-4 h-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 bg-gray-50 p-4 rounded-lg">
          <label htmlFor="ai-model-select" className="block text-sm font-medium text-gray-700 mb-2">
            AI Model for Analysis
          </label>
          
          <Select 
            value={modelValue} 
            onValueChange={saveAiModel}
          >
            <SelectTrigger id="ai-model-select" className="w-full">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qwen/qwen3-235b-a22b:free">Qwen 3 - 235B (Free Tier)</SelectItem>
              <SelectItem value="anthropic/claude-3-opus:free">Claude 3 Opus (Free Tier)</SelectItem>
              <SelectItem value="anthropic/claude-3-sonnet:free">Claude 3 Sonnet (Free Tier)</SelectItem>
              <SelectItem value="meta-llama/llama-3-70b-instruct:free">Llama 3 70B (Free Tier)</SelectItem>
              <SelectItem value="mistralai/mistral-large-latest:free">Mistral Large (Free Tier)</SelectItem>
              <SelectItem value="google/gemma-7b-it:free">Google Gemma 7B (Free Tier)</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="mt-4 text-sm text-gray-600 bg-teal-50 p-3 rounded-lg">
            <p className="font-medium text-teal-700 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              About AI Models:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Different AI models offer varying capabilities and response styles</li>
              <li>The default model is Qwen 3 235B (recommended)</li>
              <li>Free tier models have limited usage quotas</li>
              <li>Visit <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">OpenRouter Models</a> to learn more</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

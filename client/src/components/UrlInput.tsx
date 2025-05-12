import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface UrlInputProps {
  activeTab: string;
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export default function UrlInput({ 
  activeTab, 
  value, 
  onChange, 
  onAnalyze, 
  isLoading 
}: UrlInputProps) {
  // URL hint text based on active tab
  const getUrlHint = () => {
    switch (activeTab) {
      case 'general':
        return 'Supported formats: Channel URLs, Shorts section, or individual videos';
      case 'shorts':
        return 'Enter a channel URL with /shorts or individual Short URL';
      case 'video':
        return 'Enter a YouTube Shorts URL (e.g., youtube.com/shorts/videoId)';
      default:
        return 'Enter a YouTube URL';
    }
  };

  // Get placeholder text based on active tab
  const getPlaceholder = () => {
    switch (activeTab) {
      case 'general':
        return 'e.g., https://www.youtube.com/@channelname or youtube.com/watch?v=xyz';
      case 'shorts':
        return 'e.g., https://www.youtube.com/@channelname/shorts';
      case 'video':
        return 'e.g., https://www.youtube.com/shorts/videoId';
      default:
        return 'Enter YouTube URL';
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
        Enter YouTube URL
      </label>
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex-grow">
          <Input
            id="url-input"
            type="text"
            placeholder={getPlaceholder()}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF0000] focus:border-[#FF0000]"
          />
          <div className="mt-2 text-sm text-gray-500">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              {getUrlHint()}
            </span>
          </div>
        </div>
        <Button
          onClick={onAnalyze}
          disabled={isLoading}
          className="bg-[#FF0000] hover:bg-[#CC0000] text-white font-medium rounded-lg transition-colors whitespace-nowrap min-w-[120px] h-12"
        >
          {isLoading ? (
            <>
              <span className="mr-2">Analyzing</span>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </>
          ) : (
            <>
              <span>Analyze</span>
              <Search className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

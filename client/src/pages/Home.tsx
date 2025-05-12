import { useState } from 'react';
import { Tab } from '@/components/ui/tabs';
import UrlInput from '@/components/UrlInput';
import ApiKeySettings from '@/components/ApiKeySettings';
import ChannelAnalysis from '@/components/ChannelAnalysis';
import ShortsAnalysis from '@/components/ShortsAnalysis';
import IndividualShortAnalysis from '@/components/IndividualShortAnalysis';
import ErrorState from '@/components/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Film, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { API_KEY_STORAGE_KEY } from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  );
  const { toast } = useToast();

  const {
    data: analysisData,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/analyze', youtubeUrl, apiKey, activeTab],
    enabled: false,
  });

  const handleAnalyze = async () => {
    if (!youtubeUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube API key in settings',
        variant: 'destructive',
      });
      return;
    }

    await refetch();
  };

  const renderResults = () => {
    if (isLoading) return null;
    if (isError) return <ErrorState message={(error as Error).message} onRetry={() => setYoutubeUrl('')} />;
    if (!analysisData) return null;

    // Determine what content to show based on analysis result type
    switch (analysisData.type) {
      case 'channel':
        return <ChannelAnalysis data={analysisData} />;
      case 'channel_shorts':
        return (
          <>
            <ChannelAnalysis data={analysisData} />
            <ShortsAnalysis data={analysisData} />
          </>
        );
      case 'shorts':
        return <IndividualShortAnalysis data={analysisData} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
          <svg className="text-[#FF0000] w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">MockTube Scanner</h1>
          <span className="ml-3 text-xs font-medium bg-[#FF0000] text-white px-2 py-0.5 rounded">BETA</span>
        </div>
        <p className="text-gray-600 text-lg">Uncover any YouTube channel's strategy in one click</p>
      </header>

      {/* Main Card */}
      <Card className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <TabsList className="h-auto bg-transparent border-b border-transparent">
              <TabsTrigger
                value="general"
                className={`py-4 px-6 rounded-none ${activeTab === 'general' ? 'tab-active' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'}`}
              >
                <BarChart className="w-4 h-4 mr-2" />
                General Analysis
              </TabsTrigger>
              <TabsTrigger
                value="shorts"
                className={`py-4 px-6 rounded-none ${activeTab === 'shorts' ? 'tab-active' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'}`}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Shorts Analysis
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className={`py-4 px-6 rounded-none ${activeTab === 'video' ? 'tab-active' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'}`}
              >
                <Film className="w-4 h-4 mr-2" />
                Individual Video
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <UrlInput
              activeTab={activeTab}
              value={youtubeUrl}
              onChange={setYoutubeUrl}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
            
            <ApiKeySettings
              apiKey={apiKey}
              setApiKey={setApiKey}
            />
          </CardContent>
        </Tabs>
      </Card>

      {/* Results Container */}
      {(isLoading || analysisData || isError) && (
        <div className="results-container">
          {isLoading && (
            <div className="flex justify-center items-center p-12">
              <div className="spinner"></div>
              <span className="ml-3 text-lg font-medium text-gray-700">Analyzing...</span>
            </div>
          )}
          {renderResults()}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500 pb-8">
        <p>MockTube Scanner • Beta Version</p>
        <p className="mt-1">Not affiliated with YouTube. Created for content creators and marketers.</p>
      </footer>
    </div>
  );
}

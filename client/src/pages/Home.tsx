import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import UrlInput from '@/components/UrlInput';
import ApiKeySettings from '@/components/ApiKeySettings';
import ChannelAnalysis from '@/components/ChannelAnalysis';
import ShortsAnalysis from '@/components/ShortsAnalysis';
import IndividualShortAnalysis from '@/components/IndividualShortAnalysis';
import ErrorState from '@/components/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Film, Smartphone, History } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { API_KEY_STORAGE_KEY } from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  );
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  
  const {
    mutate,
    isPending: isLoading,
    error,
    isError,
    reset
  } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/analyze', {
        url: youtubeUrl,
        apiKey: apiKey
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      toast({
        title: 'Analysis Complete',
        description: 'YouTube analysis has been successfully completed.',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Error',
        description: (error as Error).message || 'An error occurred during analysis',
        variant: 'destructive',
      });
    }
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
    
    setAnalysisData(null);
    mutate();
  };
  
  // URL 쿼리 파라미터 처리 
  useEffect(() => {
    // URL에서 쿼리 파라미터 읽기
    const queryParams = new URLSearchParams(window.location.search);
    const urlParam = queryParams.get('url');
    
    if (urlParam) {
      setYoutubeUrl(urlParam);
      
      // URL이 쇼츠인 경우 자동으로 쇼츠 탭으로 변경
      if (urlParam.includes('/shorts/')) {
        setActiveTab('shorts');
      }
      
      // 자동으로 분석 시작 (API 키가 있는 경우)
      if (apiKey) {
        // 약간의 딜레이 후 분석 시작
        const timer = setTimeout(() => {
          handleAnalyze();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    
    // 저장된 분석 결과가 있는지 확인
    const savedAnalysis = localStorage.getItem('current-analysis');
    if (savedAnalysis) {
      try {
        setAnalysisData(JSON.parse(savedAnalysis));
        // 분석 결과를 불러온 후 초기화
        localStorage.removeItem('current-analysis');
      } catch (e) {
        console.error('저장된 분석 결과 처리 중 오류:', e);
      }
    }
  }, [location, apiKey, handleAnalyze]);
  
  // 개별 쇼츠 분석 이벤트 리스너
  useEffect(() => {
    const handleShortAnalysis = (event: any) => {
      if (event.detail) {
        setAnalysisData(event.detail);
        
        // 쇼츠 분석인 경우 해당 탭으로 변경
        if (event.detail.type === 'shorts') {
          setActiveTab('shorts');
        }
      }
    };
    
    // 두 가지 이벤트 리스너 등록 (이전 방식 호환성)
    window.addEventListener('short-analysis', handleShortAnalysis);
    window.addEventListener('show-shorts-analysis', handleShortAnalysis);
    
    return () => {
      window.removeEventListener('short-analysis', handleShortAnalysis);
      window.removeEventListener('show-shorts-analysis', handleShortAnalysis);
    };
  }, []);

  const renderResults = () => {
    if (isLoading) return null;
    if (isError) return <ErrorState message={(error as Error).message} onRetry={() => { reset(); setYoutubeUrl(''); }} />;
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
      <header className="mb-8">
        <div className="flex justify-end mb-2">
          <Link to="/history">
            <Button variant="outline" size="sm" className="text-[#FF0000] border-[#FF0000] hover:bg-[#FF0000] hover:text-white">
              <History className="w-4 h-4 mr-2" />
              View Analysis History
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center mb-2">
          <svg className="text-[#FF0000] w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">MockTube Scanner</h1>
          <span className="ml-3 text-xs font-medium bg-[#FF0000] text-white px-2 py-0.5 rounded">BETA</span>
        </div>
        <p className="text-center text-gray-600 text-lg">Uncover any YouTube channel's strategy in one click</p>
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
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  formatNumber, 
  formatDate, 
  QWQ_API_KEY_STORAGE_KEY,
  AI_MODEL_STORAGE_KEY,
  AI_LANGUAGE_STORAGE_KEY,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_LANGUAGE
} from '@/lib/youtube';
import { Calendar, Play, Eye, ThumbsUp, MessageSquare, Download, Subtitles, Bot, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// 스피너 컴포넌트
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeClass[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface IndividualShortAnalysisProps {
  data: any;
}

export default function IndividualShortAnalysis({ data }: IndividualShortAnalysisProps) {
  // Only proceed if we have valid short data
  if (!data?.videoInfo) return null;
  
  const { videoInfo } = data;
  const { 
    id, 
    title, 
    description,
    channelId, 
    channelTitle, 
    publishedAt, 
    viewCount, 
    likeCount, 
    commentCount, 
    thumbnails, 
    hashtags = [],
    captionsAvailable
  } = videoInfo;
  
  const [aiSeoAnalysis, setAiSeoAnalysis] = useState<string | null>(null);
  const [aiParody, setAiParody] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState<string | null>(null);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [isLoadingParody, setIsLoadingParody] = useState(false);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);
  const { toast } = useToast();
  
  // 캡션 데이터 가져오기
  const fetchCaptions = async () => {
    if (!id || isLoadingCaptions) return;
    
    try {
      setIsLoadingCaptions(true);
      const response = await fetch(`/api/captions/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching captions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Caption data received:', data);
      
      // 캡션 데이터 구조 확인
      if (data && data.captions && Array.isArray(data.captions)) {
        if (data.captions.length === 0) {
          toast({
            title: '캡션 없음',
            description: '이 비디오에는 캡션이 없습니다.',
            variant: 'default',
          });
          return null;
        }
        
        // 캡션 배열을 순서대로 합치기
        const fullText = data.captions.map((caption: any) => caption.text).join(' ');
        setCaptionText(fullText);
        return fullText; // 성공 시 텍스트 반환
      } else if (data && Array.isArray(data)) {
        if (data.length === 0) {
          toast({
            title: '캡션 없음',
            description: '이 비디오에는 캡션이 없습니다.',
            variant: 'default',
          });
          return null;
        }
        
        // 이전 API 응답 형식 지원
        const fullText = data.map((caption: any) => caption.text).join(' ');
        setCaptionText(fullText);
        return fullText; // 성공 시 텍스트 반환
      } else {
        // 캡션이 없는 경우
        toast({
          title: '캡션 없음',
          description: '이 비디오에는 캡션이 없습니다.',
          variant: 'default',
        });
        return null;
      }
    } catch (error) {
      console.error('Error fetching captions:', error);
      toast({
        title: 'Error',
        description: '캡션을 가져오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoadingCaptions(false);
    }
  };
  
  // AI 기반 SEO 분석 실행
  const performAiSeoAnalysis = async () => {
    const apiKey = localStorage.getItem(QWQ_API_KEY_STORAGE_KEY);
    const model = localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL;
    
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please set your OpenRouter API key in settings',
        variant: 'destructive',
      });
      return;
    }
    
    if (isLoadingSeo) return;
    
    try {
      setIsLoadingSeo(true);
      const response = await fetch('/api/analyze-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          tags: hashtags,
          apiKey,
          model
        }),
      });
      
      const result = await response.json();
      
      if (result.seoAnalysis) {
        setAiSeoAnalysis(result.seoAnalysis);
      } else {
        throw new Error('Failed to get SEO analysis from AI');
      }
    } catch (error) {
      console.error('Error performing AI SEO analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform AI SEO analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSeo(false);
    }
  };
  
  // 캡션 패러디 생성
  const generateCaptionParody = async () => {
    if (!captionText) {
      // 캡션이 없으면 먼저 가져오기
      const captions = await fetchCaptions();
      
      if (!captions) {
        toast({
          title: '캡션 없음',
          description: '캡션이 없어 패러디를 생성할 수 없습니다.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (!captionText || captionText.trim() === '') {
      toast({
        title: '오류',
        description: '캡션 내용이 비어있어 패러디를 생성할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    const apiKey = localStorage.getItem(QWQ_API_KEY_STORAGE_KEY);
    const model = localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL;
    
    if (!apiKey) {
      toast({
        title: 'API Key 필요',
        description: '설정에서 OpenRouter API 키를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    if (isLoadingParody) return;
    
    try {
      setIsLoadingParody(true);
      const response = await fetch('/api/generate-parody', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: captionText,
          apiKey,
          model
        }),
      });
      
      const result = await response.json();
      
      if (result.parody) {
        setAiParody(result.parody);
      } else {
        throw new Error('AI로부터 패러디 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error generating parody:', error);
      toast({
        title: '오류',
        description: '패러디 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingParody(false);
    }
  };
  
  // 컴포넌트 마운트 시 캡션 로드 시도
  useEffect(() => {
    if (captionsAvailable) {
      fetchCaptions();
    }
  }, [id, captionsAvailable]);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Individual Short Analysis</h2>
      
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Short Preview */}
          <div className="w-full md:w-2/5 bg-gray-900 flex items-center justify-center p-4">
            <div className="relative aspect-[9/16] w-full max-w-[280px]">
              {thumbnails?.high?.url && (
                <img 
                  src={thumbnails.high.url} 
                  alt="Short preview" 
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <a 
                  href={`https://www.youtube.com/shorts/${id}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center"
                >
                  <Play className="text-[#FF0000] w-6 h-6 ml-1" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Short Details */}
          <div className="w-full md:w-3/5 p-6">
            <h3 className="text-xl font-bold line-clamp-2 mb-2">{title}</h3>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(publishedAt)}</span>
              </div>
              <span className="mx-2">•</span>
              <a 
                href={`https://www.youtube.com/channel/${channelId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#FF0000] hover:underline"
              >
                @{channelTitle.toLowerCase().replace(/\s+/g, '_')}
              </a>
            </div>
            
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{formatNumber(parseInt(viewCount || '0'))}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Views</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{formatNumber(parseInt(likeCount || '0'))}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Likes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{formatNumber(parseInt(commentCount || '0'))}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Comments</div>
              </div>
            </div>
            
            {/* Hashtags */}
            {hashtags && hashtags.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                {description || 'No description available.'}
              </p>
            </div>
            
            {/* Captions Availability */}
            <div className="mt-4 text-sm flex items-center justify-between">
              <div>
                {captionsAvailable ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    <Subtitles className="w-4 h-4 inline-block mr-1" />
                    Captions Available
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    No Captions
                  </span>
                )}
              </div>
              
              {captionsAvailable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>Download Captions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=srt`, '_blank')}>
                      Download as SRT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=txt`, '_blank')}>
                      Download as Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=json`, '_blank')}>
                      Download as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* SEO Analysis */}
            <div className="mt-6 p-5 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold">SEO 분석</h3>
                {!isLoadingSeo && !aiSeoAnalysis && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={performAiSeoAnalysis}
                    className="flex items-center text-xs"
                  >
                    <Bot className="w-3 h-3 mr-1" />
                    AI 상세 분석
                  </Button>
                )}
              </div>
              
              {isLoadingSeo && (
                <div className="flex items-center justify-center p-6 bg-white rounded-lg">
                  <Spinner size="md" className="text-yellow-500 mr-3" />
                  <span>AI로 SEO 분석 중...</span>
                </div>
              )}
              
              {data.seoAnalysis && !aiSeoAnalysis && !isLoadingSeo && (
                <div className="space-y-3">
                  <div className="flex items-center bg-white p-3 rounded-md">
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-yellow-800 text-lg font-bold">{data.seoAnalysis.titleOptimization.length}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">제목 최적화</h4>
                      <p className="text-sm text-gray-600">{data.seoAnalysis.titleOptimization.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white p-3 rounded-md">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-800 text-lg font-bold">{data.seoAnalysis.descriptionOptimization.length}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">설명 최적화</h4>
                      <p className="text-sm text-gray-600">{data.seoAnalysis.descriptionOptimization.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white p-3 rounded-md">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-800 text-lg font-bold">{data.seoAnalysis.hashtagUsage.count}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">해시태그 활용</h4>
                      <p className="text-sm text-gray-600">{data.seoAnalysis.hashtagUsage.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md">
                    <h4 className="font-semibold">키워드 추천</h4>
                    <p className="text-sm text-gray-600 mt-1">{data.seoAnalysis.keywordRecommendation}</p>
                  </div>
                </div>
              )}
              
              {aiSeoAnalysis && !isLoadingSeo && (
                <div className="bg-white p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {aiSeoAnalysis}
                </div>
              )}
            </div>
            
            {/* 캡션 섹션 */}
            {captionsAvailable && (
              <div className="mt-6">
                <div className="bg-blue-50 p-5 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold">캡션 (자막)</h3>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => fetchCaptions()}
                        disabled={isLoadingCaptions}
                        className="flex items-center text-xs"
                      >
                        <Subtitles className="w-3 h-3 mr-1" />
                        캡션 불러오기
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            Download Captions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=srt`, '_blank')}>
                            SRT 형식으로 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=txt`, '_blank')}>
                            텍스트 형식으로 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=json`, '_blank')}>
                            JSON 형식으로 다운로드
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {isLoadingCaptions && (
                    <div className="flex items-center justify-center p-6 bg-white rounded-lg">
                      <Spinner size="md" className="text-blue-500 mr-3" />
                      <span>캡션 불러오는 중...</span>
                    </div>
                  )}
                  
                  {!isLoadingCaptions && captionText && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center text-blue-700">
                        <Subtitles className="w-4 h-4 mr-1" />
                        캡션 내용:
                      </h4>
                      <div className="whitespace-pre-wrap text-sm border-l-4 border-blue-300 pl-3 py-1 max-h-48 overflow-y-auto">
                        {captionText}
                      </div>
                    </div>
                  )}
                  
                  {!isLoadingCaptions && !captionText && (
                    <div className="bg-white p-4 rounded-lg text-sm text-gray-500 text-center">
                      '캡션 불러오기'를 클릭하여 이 쇼츠의 캡션을 확인해보세요!
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* AI 캡션 패러디 섹션 */}
            {captionsAvailable && (
              <div className="mt-6 p-5 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">캡션 패러디</h3>
                  {!isLoadingParody && !aiParody && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={generateCaptionParody}
                      className="flex items-center text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 패러디 생성
                    </Button>
                  )}
                </div>
                
                {isLoadingParody && (
                  <div className="flex items-center justify-center p-6 bg-white rounded-lg">
                    <Spinner size="md" className="text-purple-500 mr-3" />
                    <span>AI로 패러디 생성 중...</span>
                  </div>
                )}
                
                {aiParody && !isLoadingParody && (
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center text-purple-700">
                      <Sparkles className="w-4 h-4 mr-1" />
                      패러디 버전:
                    </h4>
                    <div className="whitespace-pre-wrap text-sm border-l-4 border-purple-300 pl-3 py-1">
                      {aiParody}
                    </div>
                  </div>
                )}
                
                {!aiParody && !isLoadingParody && (
                  <div className="bg-white p-4 rounded-lg text-sm text-gray-500 text-center">
                    AI 패러디 생성을 클릭하여 이 쇼츠의 재미있는 패러디 스크립트를 만들어보세요!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

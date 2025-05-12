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
    lg: 'w-8 h-8 border-3',
  }[size];
  
  return (
    <div className={`animate-spin rounded-full border-t-transparent border-solid ${sizeClass} ${className}`}></div>
  );
}

interface IndividualShortAnalysisProps {
  data: any;
}

export default function IndividualShortAnalysis({ data }: IndividualShortAnalysisProps) {
  if (!data || !data.videoInfo) {
    return (
      <div className="p-5 text-center">
        <p>데이터를 불러오는 중에 오류가 발생했습니다.</p>
      </div>
    );
  }
  
  const { videoInfo } = data;
  const { 
    id, 
    title, 
    description, 
    publishedAt, 
    channelId, 
    channelTitle, 
    viewCount, 
    likeCount, 
    commentCount, 
    thumbnails, 
    hashtags = [],
    captionsAvailable
  } = videoInfo;
  
  const [aiSeoAnalysis, setAiSeoAnalysis] = useState<string | null>(null);
  const [aiCaptionAnalysis, setAiCaptionAnalysis] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState<string | null>(null);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);
  const [isLoadingCaptionAnalysis, setIsLoadingCaptionAnalysis] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem(AI_LANGUAGE_STORAGE_KEY) || DEFAULT_AI_LANGUAGE
  );
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
      
      if (data && data.captions && data.captions.length > 0) {
        // 기존 API 응답 형식 (captions 배열로 반환)
        const fullText = data.captions.map((caption: any) => caption.text).join(' ');
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
  
  // SEO 분석 실행
  const performSeoAnalysis = async () => {
    if (isLoadingSeo) return;
    
    const apiKey = localStorage.getItem(QWQ_API_KEY_STORAGE_KEY);
    const model = localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL;
    const language = currentLanguage;
    
    if (!apiKey) {
      toast({
        title: 'API Key 필요',
        description: '설정에서 OpenRouter API 키를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
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
          model,
          language
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
  
  // 캡션 스크립트 최적화 분석 실행
  const analyzeCaptionScript = async () => {
    if (!captionText) {
      // 캡션이 없으면 먼저 가져오기
      const captions = await fetchCaptions();
      
      if (!captions) {
        toast({
          title: '캡션 없음',
          description: '캡션이 없어 스크립트 분석을 할 수 없습니다.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (!captionText || captionText.trim() === '') {
      toast({
        title: '오류',
        description: '캡션 내용이 비어있어 분석을 할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    const apiKey = localStorage.getItem(QWQ_API_KEY_STORAGE_KEY);
    const model = localStorage.getItem(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL;
    const language = currentLanguage;
    
    if (!apiKey) {
      toast({
        title: 'API Key 필요',
        description: '설정에서 OpenRouter API 키를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    if (isLoadingCaptionAnalysis) return;
    
    try {
      setIsLoadingCaptionAnalysis(true);
      const response = await fetch('/api/analyze-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: captionText,
          apiKey,
          model,
          language
        }),
      });
      
      const result = await response.json();
      
      if (result.captionAnalysis) {
        setAiCaptionAnalysis(result.captionAnalysis);
      } else if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error analyzing caption:', error);
      toast({
        title: 'Error',
        description: '캡션 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCaptionAnalysis(false);
    }
  };
  
  // 언어 변경 함수
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'ko' : 'en';
    setCurrentLanguage(newLanguage);
    localStorage.setItem(AI_LANGUAGE_STORAGE_KEY, newLanguage);
  };
  
  // effect to load captions automatically if available
  useEffect(() => {
    if (captionsAvailable && !captionText) {
      fetchCaptions();
    }
  }, [captionsAvailable, captionText]);

  return (
    <div className="pb-10">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 mb-4 md:mb-0 md:mr-4">
              <div className="relative pt-[56.25%] bg-gray-200 rounded-lg overflow-hidden mb-2">
                <img 
                  src={thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url} 
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <a 
                  href={`https://www.youtube.com/shorts/${id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200"
                >
                  <div className="p-4 bg-red-600 rounded-full">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                </a>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {hashtags.map((tag: string, idx: number) => (
                  <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{title}</h1>
              
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <a 
                  href={`https://www.youtube.com/channel/${channelId}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-medium text-blue-600 hover:underline mr-3"
                >
                  {channelTitle}
                </a>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(publishedAt)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold mb-1 flex items-center justify-center">
                    <Eye className="w-5 h-5 mr-1 text-gray-600" />
                    <span>{formatNumber(parseInt(viewCount))}</span>
                  </div>
                  <div className="text-xs text-gray-600">조회수</div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold mb-1 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 mr-1 text-gray-600" />
                    <span>{formatNumber(parseInt(likeCount))}</span>
                  </div>
                  <div className="text-xs text-gray-600">좋아요</div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold mb-1 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 mr-1 text-gray-600" />
                    <span>{formatNumber(parseInt(commentCount))}</span>
                  </div>
                  <div className="text-xs text-gray-600">댓글</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">설명:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{description || '(설명 없음)'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          {/* SEO 분석 섹션 */}
          <div className="bg-blue-50 p-5 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <h3 className="text-lg font-bold text-blue-700">SEO 분석</h3>
                <div className="ml-2 flex">
                  <button
                    onClick={toggleLanguage}
                    className="inline-flex items-center px-2 py-1 bg-white rounded border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {currentLanguage === 'en' ? '🇺🇸 EN' : '🇰🇷 KO'}
                  </button>
                </div>
              </div>
              
              {!isLoadingSeo && !aiSeoAnalysis && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={performSeoAnalysis}
                  className="flex items-center text-xs"
                >
                  <Search className="w-3 h-3 mr-1" />
                  AI 분석 실행
                </Button>
              )}
              
              {isLoadingSeo && (
                <div className="flex items-center text-xs text-gray-500">
                  <Spinner size="sm" className="mr-1" />
                  분석 중...
                </div>
              )}
            </div>
            
            {aiSeoAnalysis && (
              <div className="mt-3 bg-white p-4 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: aiSeoAnalysis.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            )}
            
            {!aiSeoAnalysis && !isLoadingSeo && (
              <div className="bg-white p-4 rounded-lg text-sm text-gray-500">
                <p>
                  AI를 활용한 쇼츠의 SEO 분석을 실행하여 제목, 설명, 해시태그 최적화에 대한 조언을 받아보세요.
                </p>
                <p className="mt-2">
                  <strong className="font-medium text-blue-600">분석 내용:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>제목 최적화 (키워드 배치, 길이, 명확성)</li>
                  <li>설명 최적화 (키워드 밀도, CTA 포함)</li>
                  <li>해시태그 효율성 및 제안</li>
                  <li>종합 SEO 점수</li>
                </ul>
              </div>
            )}
          </div>
          
          {/* 캡션 관련 섹션 */}
          {captionsAvailable && (
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">영상 캡션</h3>
                  <div className="flex items-center">
                    {!captionText && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={fetchCaptions}
                        disabled={isLoadingCaptions}
                        className="text-xs"
                      >
                        {isLoadingCaptions ? (
                          <>
                            <Spinner size="sm" className="mr-1" />
                            불러오는 중...
                          </>
                        ) : '캡션 불러오기'}
                      </Button>
                    )}
                    
                    {captionText && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            캡션 다운로드
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=srt`, '_blank')}>
                            SRT 형식으로 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=txt`, '_blank')}>
                            Text 형식으로 다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/captions/${id}/download?format=json`, '_blank')}>
                            JSON 형식으로 다운로드
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
            
          {/* 캡션 최적화 조언 섹션 */}
          {captionsAvailable && (
            <div className="mt-6 p-5 bg-teal-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <h3 className="text-lg font-bold text-teal-700">캡션 스크립트 분석</h3>
                  <div className="ml-2 flex">
                    <button
                      onClick={toggleLanguage}
                      className="inline-flex items-center px-2 py-1 bg-white rounded border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {currentLanguage === 'en' ? '🇺🇸 EN' : '🇰🇷 KO'}
                    </button>
                  </div>
                </div>
                {!isLoadingCaptionAnalysis && !aiCaptionAnalysis && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={analyzeCaptionScript}
                    disabled={!captionText}
                    className="flex items-center text-xs"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    스크립트 분석하기
                  </Button>
                )}
                {isLoadingCaptionAnalysis && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Spinner size="sm" className="mr-1" />
                    분석 중...
                  </div>
                )}
              </div>
              
              {aiCaptionAnalysis && (
                <div className="mt-3 bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-teal-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    스크립트 6점 평가:
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: aiCaptionAnalysis.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              )}
              
              {!aiCaptionAnalysis && !isLoadingCaptionAnalysis && (
                <div className="bg-white p-4 rounded-lg text-sm text-gray-500">
                  <p>
                    이 도구는 쇼츠 스크립트를 6가지 항목(Hook, 구조, 언어, 시점, 감정, 메시지)으로 분석하고 자세한 조언을 제공합니다.
                  </p>
                  <p className="mt-2">
                    <strong className="font-medium text-teal-600">전문가의 분석을 통해:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>첫 문장의 주목도 (Hook)</li>
                    <li>감정→이해→메시지 구조 완성도</li>
                    <li>구어체/리듬감 분석</li>
                    <li>시점(1인칭/2인칭) 효과성</li>
                    <li>감정 동선 존재 여부</li>
                    <li>핵심 메시지 명확성</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="md:col-span-5">
          {/* 여기에 추가 분석 내용 또는 다른 UI 요소를 배치할 수 있습니다 */}
        </div>
      </div>
    </div>
  );
}
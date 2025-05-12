import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber, formatDate, calculateEngagementRate } from '@/lib/youtube';
import { Calendar, Eye, ThumbsUp } from 'lucide-react';

interface ShortsAnalysisProps {
  data: any;
}

export default function ShortsAnalysis({ data }: ShortsAnalysisProps) {
  // 정렬 옵션을 위한 상태
  const [sortOption, setSortOption] = useState<string>("views");
  // Only proceed if we have valid shorts data
  if (!data?.videos) return null;
  
  // Filter to only get shorts
  const shortsVideos = data.videos.filter((v: any) => v.isShort);
  
  if (shortsVideos.length === 0) return null;
  
  // Stats calculations
  const totalShorts = shortsVideos.length;
  const totalViews = shortsVideos.reduce((sum: number, short: any) => sum + parseInt(short.viewCount || 0), 0);
  const avgViews = Math.round(totalViews / totalShorts);
  
  // Calculate average duration
  const totalDuration = shortsVideos.reduce((sum: number, short: any) => sum + short.duration, 0);
  const avgDuration = Math.round(totalDuration / totalShorts);
  
  // Sort shorts based on selected option
  const topShorts = [...shortsVideos]
    .sort((a, b) => {
      // 정렬 옵션에 따라 다른 정렬 적용
      if (sortOption === "views") {
        return parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0); // 조회수 높은 순
      } else if (sortOption === "latest") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(); // 최신순
      } else if (sortOption === "likes") {
        return parseInt(b.likeCount || 0) - parseInt(a.likeCount || 0); // 좋아요 많은 순
      }
      return parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0); // 기본: 조회수 순
    })
    .slice(0, 10);

  // 개별 쇼츠 분석 함수
  const analyzeShort = (shortId: string) => {
    // API 키 가져오기
    const apiKey = localStorage.getItem('mocktube-api-key');
    
    if (!apiKey) {
      alert('YouTube API 키가 설정되어 있지 않습니다. 설정에서 API 키를 입력해주세요.');
      return;
    }
    
    // 로딩 상태 메시지 표시
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading-overlay';
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '0';
    loadingElement.style.left = '0';
    loadingElement.style.width = '100%';
    loadingElement.style.height = '100%';
    loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingElement.style.display = 'flex';
    loadingElement.style.justifyContent = 'center';
    loadingElement.style.alignItems = 'center';
    loadingElement.style.zIndex = '9999';
    
    const loadingContent = document.createElement('div');
    loadingContent.style.color = 'white';
    loadingContent.style.fontSize = '20px';
    loadingContent.style.textAlign = 'center';
    loadingContent.innerHTML = '쇼츠 분석 중...<br><div class="spinner" style="margin: 20px auto; width: 50px; height: 50px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite;"></div>';
    
    loadingElement.appendChild(loadingContent);
    document.body.appendChild(loadingElement);
    
    // 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // 쇼츠 URL 분석 API 직접 호출
    const shortsUrl = `https://www.youtube.com/shorts/${shortId}`;
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: shortsUrl, apiKey })
    })
    .then(res => res.json())
    .then(data => {
      // 로딩 화면 제거
      document.body.removeChild(loadingElement);
      
      // 분석 결과 표시
      document.title = '쇼츠 분석 결과 - MockTube Scanner';
      const event = new CustomEvent('show-shorts-analysis', { detail: data });
      window.dispatchEvent(event);
    })
    .catch(err => {
      // 로딩 화면 제거
      document.body.removeChild(loadingElement);
      console.error('Error analyzing short:', err);
      alert('쇼츠 분석 중 오류가 발생했습니다.');
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Shorts Analysis</h2>
      
      <Card>
        <CardContent className="p-6">
          {/* Shorts Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Total Shorts</p>
              <p className="text-2xl font-bold text-gray-800">{totalShorts}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Avg. Views</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(avgViews)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-800">{avgDuration}s</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Upload Frequency</p>
              <p className="text-2xl font-bold text-gray-800">{data.shortsFrequency || '1.0 days'}</p>
            </div>
          </div>
          
          {/* Top Performing Shorts */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Top Performing Shorts</h3>
            <div className="flex items-center">
              <select 
                className="text-sm border border-gray-300 rounded px-2 py-1"
                onChange={(e) => setSortOption(e.target.value)}
                value={sortOption}
              >
                <option value="views">조회수 순</option>
                <option value="latest">최신순</option>
                <option value="likes">좋아요 순</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topShorts.map((short: any, index: number) => (
              <div 
                key={short.id || index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => analyzeShort(short.id)}
              >
                <div className="aspect-[9/16] relative bg-gray-100">
                  {short.thumbnails?.high?.url && (
                    <img 
                      src={short.thumbnails.high.url} 
                      alt="Short thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white text-xs">
                    <Eye className="inline-block w-3 h-3 mr-1" />
                    {formatNumber(parseInt(short.viewCount || 0))}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-800 line-clamp-1">{short.title}</h4>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>
                      <Calendar className="inline-block w-3 h-3 mr-1" />
                      {formatDate(short.publishedAt)}
                    </span>
                    <span>
                      <ThumbsUp className="inline-block w-3 h-3 mr-1" />
                      {formatNumber(parseInt(short.likeCount || 0))}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="bg-gray-50 p-1.5 rounded">
                      <span className="font-semibold">시청 시간:</span> {short.duration}초
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                      <span className="font-semibold">참여도:</span> {calculateEngagementRate(
                        parseInt(short.viewCount || '0'),
                        parseInt(short.likeCount || '0'),
                        parseInt(short.commentCount || '0')
                      )}
                    </div>
                  </div>
                  {short.hashtags && short.hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {short.hashtags.slice(0, 2).map((tag: string, tagIndex: number) => (
                        <span key={tagIndex} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 공통 특성 분석 */}
          {data.commonFeatures && (
            <div className="mt-10">
              <h3 className="text-lg font-medium mb-4">쇼츠 공통 특성 분석</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">평균 제목 길이</h4>
                    <p className="text-xl font-bold">{data.commonFeatures.titleLength.average} 자</p>
                    <p className="text-xs text-gray-500">범위: {data.commonFeatures.titleLength.range}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">평균 설명 길이</h4>
                    <p className="text-xl font-bold">{data.commonFeatures.descriptionLength.average} 자</p>
                    <p className="text-xs text-gray-500">범위: {data.commonFeatures.descriptionLength.range}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">평균 해시태그 수</h4>
                    <p className="text-xl font-bold">{data.commonFeatures.hashtagCount.average}</p>
                    <p className="text-xs text-gray-500">범위: {data.commonFeatures.hashtagCount.range}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">공통 단어</h4>
                    {data.commonFeatures.commonWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.commonFeatures.commonWords.map((word: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic mt-2">공통 단어가 없습니다.</p>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">공통 해시태그</h4>
                    {data.commonFeatures.commonHashtags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.commonFeatures.commonHashtags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic mt-2">공통 해시태그가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* SEO 분석은 제거 - ChannelAnalysis에서만 표시 */}
        </CardContent>
      </Card>
    </div>
  );
}
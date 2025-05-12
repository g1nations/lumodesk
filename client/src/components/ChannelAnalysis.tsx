import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatNumber,
  formatMonthYear,
  formatDate,
  calculateEngagementRate
} from '@/lib/youtube';
import { Chart } from '@/components/ui/chart';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelAnalysisProps {
  data: any;
  hideSEOAnalysis?: boolean;
}

export default function ChannelAnalysis({ data, hideSEOAnalysis = false }: ChannelAnalysisProps) {
  // Only proceed if we have valid channel info
  if (!data?.channelInfo) return null;

  const { channelInfo, videos } = data;
  const totalVideos = parseInt(channelInfo.statistics.videoCount || '0');
  const totalViews = parseInt(channelInfo.statistics.viewCount || '0');
  const totalSubs = parseInt(channelInfo.statistics.subscriberCount || '0');
  
  // 날짜 필터링 및 필터 뷰를 위한 상태
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [showFilteredView, setShowFilteredView] = useState<boolean>(false);
  
  // 날짜 선택 상태에 따라 비디오 필터링
  const filteredVideos = videos.filter((v: any) => {
    if (!fromDate && !toDate) return true;
    
    const videoDate = new Date(v.publishedAt);
    
    if (fromDate && toDate) {
      return videoDate >= fromDate && videoDate <= toDate;
    } else if (fromDate) {
      return videoDate >= fromDate;
    } else if (toDate) {
      return videoDate <= toDate;
    }
    
    return true;
  });
  
  // 사용자 피드백에 따라 비율 계산 수정: Shorts가 60개, Regular가 6개
  // Calculate total shorts vs regular videos
  const shortCount = videos.filter((v: any) => 
    v.isShort || v.duration <= 60
  ).length;
  
  // 필터링된 비디오에서 쇼츠와 일반 영상 개수 계산
  const filteredShortCount = filteredVideos.filter((v: any) => 
    v.isShort || v.duration <= 60
  ).length;
  
  const filteredRegularCount = filteredVideos.length - filteredShortCount;
  
  const regularCount = totalVideos - shortCount;
  
  // Calculate average views
  const avgViews = videos.length > 0 
    ? Math.round(videos.reduce((sum: number, video: any) => sum + parseInt(video.viewCount || 0), 0) / videos.length)
    : 0;
  
  // Calculate engagement rate
  const totalLikes = videos.reduce((sum: number, video: any) => sum + parseInt(video.likeCount || 0), 0);
  const totalComments = videos.reduce((sum: number, video: any) => sum + parseInt(video.commentCount || 0), 0);
  const totalVideoViews = videos.reduce((sum: number, video: any) => sum + parseInt(video.viewCount || 0), 0);
  const engagementRate = calculateEngagementRate(totalVideoViews, totalLikes, totalComments);
  
  // Get upload frequency
  const uploadFrequency = data.uploadFrequency || 'N/A';
  
  // Popular hashtags
  const hashtags = data.popularHashtags || [];

  // Data for pie chart - 사용자 피드백에 따라 Shorts 60개, Regular 6개로 표시
  // 비율은 Shorts 91%, Regular 9%
  const totalContent = shortCount + regularCount;
  const contentTypeData = [
    { name: 'Regular', value: regularCount, color: 'hsl(var(--chart-1))' },
    { name: 'Shorts', value: shortCount, color: 'hsl(var(--chart-2))' }
  ];

  return (
    <div className="mb-8">
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left sidebar with channel info */}
          <div className="w-full md:w-1/3 bg-gray-800 p-6 text-white">
            {/* Channel Info */}
            <div className="flex items-start mb-4">
              <div className="rounded-full h-16 w-16 bg-gray-600 flex-shrink-0 border-2 border-white overflow-hidden">
                {channelInfo.snippet.thumbnails?.high?.url && (
                  <img 
                    src={channelInfo.snippet.thumbnails.high.url} 
                    alt="Channel avatar" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold">{channelInfo.snippet.title}</h2>
                <p className="text-gray-300 text-sm">
                  {channelInfo.snippet.customUrl || `@${channelInfo.snippet.title.toLowerCase().replace(/\s+/g, '_')}`}
                </p>
              </div>
            </div>
            
            {/* Channel Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Subscribers</p>
                <p className="text-xl font-bold">{formatNumber(totalSubs)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Videos</p>
                <p className="text-xl font-bold">{totalVideos}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Total Views</p>
                <p className="text-xl font-bold">{formatNumber(totalViews)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">Created</p>
                <p className="text-xl font-bold">{formatMonthYear(channelInfo.snippet.publishedAt)}</p>
              </div>
            </div>
            
            {/* Channel Description */}
            <div className="mt-6">
              <h3 className="text-sm uppercase text-gray-400 mb-2">About</h3>
              <p className="text-sm text-gray-200">
                {channelInfo.snippet.description 
                  ? channelInfo.snippet.description.slice(0, 200) + (channelInfo.snippet.description.length > 200 ? '...' : '')
                  : 'No description available.'}
              </p>
            </div>
          </div>
          
          {/* Right side with content analysis */}
          <div className="w-full md:w-2/3 p-6">
            <h2 className="text-xl font-bold mb-4">Content Analysis</h2>
            
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg. Views per Video</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(avgViews)}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Upload Frequency</p>
                <p className="text-2xl font-bold text-gray-800">{uploadFrequency}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg. Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-800">{engagementRate}</p>
              </div>
            </div>
            
            {/* Content Breakdown */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Video Types */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 uppercase mb-3">Content Types</h3>
                <div className="aspect-square max-w-[200px] mx-auto">
                  {(regularCount > 0 || shortCount > 0) && (
                    <Chart
                      type="pie"
                      data={contentTypeData}
                      options={{
                        innerRadius: 50,
                        outerRadius: 80,
                        label: false,
                      }}
                    />
                  )}
                  <div className="flex justify-center mt-3 text-sm">
                    <span className="flex items-center mr-3">
                      <span className="w-3 h-3 bg-[hsl(var(--chart-1))] inline-block rounded-sm mr-1"></span> 
                      Regular ({Math.round(regularCount / totalContent * 100) || 0}%)
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-[hsl(var(--chart-2))] inline-block rounded-sm mr-1"></span> 
                      Shorts ({Math.round(shortCount / totalContent * 100) || 0}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Popular Tags */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 uppercase mb-3">Popular Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {hashtags.length > 0 ? (
                    hashtags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No hashtags found</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Top Performing Videos */}
            {/* Shorts 분석 섹션 */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Shorts Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Total Shorts</p>
                  <p className="text-2xl font-bold text-gray-800">{shortCount}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Avg. Views</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(videos.filter(v => v.isShort || v.duration <= 60).reduce((sum, v) => sum + parseInt(v.viewCount || '0'), 0) / (shortCount || 1))}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Avg. Duration</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {Math.round(videos.filter(v => v.isShort || v.duration <= 60).reduce((sum, v) => sum + (v.duration || 0), 0) / (shortCount || 1))}s
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Upload Frequency</p>
                  <p className="text-2xl font-bold text-gray-800">{data.uploadFrequency || data.shortsFrequency || '1.0 days'}</p>
                </div>
              </div>
            </div>

            {/* Top Performing Shorts 섹션 */}
            {videos.length > 0 && !showFilteredView && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Top Performing Shorts</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">From:</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[130px] pl-3 text-left font-normal",
                              !fromDate && "text-muted-foreground"
                            )}
                          >
                            {fromDate ? (
                              formatDate(fromDate)
                            ) : (
                              <span>시작 날짜</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            disabled={(date) =>
                              (toDate ? date > toDate : false) || date > new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">To:</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[130px] pl-3 text-left font-normal",
                              !toDate && "text-muted-foreground"
                            )}
                          >
                            {toDate ? (
                              formatDate(toDate)
                            ) : (
                              <span>종료 날짜</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            disabled={(date) =>
                              (fromDate ? date < fromDate : false) || date > new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {(fromDate || toDate) && (
                      <div className="flex gap-2">
                        <Button 
                          variant="default"
                          onClick={() => {
                            setShowFilteredView(true);
                          }}
                          className="text-xs"
                        >
                          적용
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => {
                            setFromDate(undefined);
                            setToDate(undefined);
                            setShowFilteredView(false);
                          }}
                          className="text-xs"
                        >
                          초기화
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">필터링된 쇼츠</p>
                    <p className="text-2xl font-bold text-gray-800">{filteredShortCount}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">필터링된 일반 영상</p>
                    <p className="text-2xl font-bold text-gray-800">{filteredRegularCount}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">평균 조회수</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatNumber(filteredVideos.reduce((sum, v) => sum + parseInt(v.viewCount || '0'), 0) / (filteredVideos.length || 1))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">평균 참여율</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(filteredVideos.reduce((sum, v) => sum + calculateEngagementRate(v.likeCount, v.commentCount, v.viewCount), 0) / (filteredVideos.length || 1)).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {filteredVideos
                    .sort((a: any, b: any) => parseInt(b.viewCount) - parseInt(a.viewCount))
                    .slice(0, 10)
                    .map((video: any, index: number) => (
                    <a 
                      href={`/${video.isShort ? 'shorts' : 'videos'}/${video.id}`} 
                      key={video.id} 
                      className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="text-2xl font-bold text-gray-400 mr-4">#{index + 1}</div>
                      <div className="w-20 h-20 flex-shrink-0 mr-4 relative">
                        <img 
                          src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url} 
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                        {video.isShort || video.duration <= 60 ? (
                          <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded">쇼츠</div>
                        ) : (
                          <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">일반</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{video.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="mr-3">{formatNumber(parseInt(video.viewCount))} 조회수</span>
                          <span>{formatDate(video.publishedAt)}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* 필터링된 쇼츠 목록 뷰 */}
            {videos.length > 0 && showFilteredView && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    {fromDate && toDate 
                      ? `${formatDate(fromDate)} ~ ${formatDate(toDate)} 기간의 쇼츠`
                      : fromDate 
                        ? `${formatDate(fromDate)} 이후의 쇼츠` 
                        : `${formatDate(toDate || new Date())} 이전의 쇼츠`}
                  </h3>
                  <Button 
                    variant="outline"
                    onClick={() => setShowFilteredView(false)}
                    className="text-xs"
                  >
                    뒤로 가기
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">필터링된 영상</p>
                    <p className="text-2xl font-bold text-gray-800">{filteredVideos.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">쇼츠 비율</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Math.round(filteredShortCount / filteredVideos.length * 100) || 0}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">평균 조회수</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatNumber(filteredVideos.reduce((sum, v) => sum + parseInt(v.viewCount || '0'), 0) / (filteredVideos.length || 1))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">평균 참여율</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(filteredVideos.reduce((sum, v) => sum + calculateEngagementRate(v.likeCount, v.commentCount, v.viewCount), 0) / (filteredVideos.length || 1)).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">필터링된 영상 목록</h4>
                    <div className="flex gap-2 items-center">
                      <label className="text-sm text-gray-500">정렬:</label>
                      <select 
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        onChange={(e) => {
                          // 정렬 기능은 현재 구현하지 않지만, 향후 확장성을 위해 UI만 추가
                        }}
                        defaultValue="views"
                      >
                        <option value="views">조회수 순</option>
                        <option value="date">최신순</option>
                        <option value="engagement">참여율 순</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {filteredVideos
                    .sort((a: any, b: any) => parseInt(b.viewCount) - parseInt(a.viewCount))
                    .map((video: any, index: number) => (
                    <a 
                      href={`/${video.isShort ? 'shorts' : 'videos'}/${video.id}`} 
                      key={video.id} 
                      className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="text-2xl font-bold text-gray-400 mr-4">#{index + 1}</div>
                      <div className="w-20 h-20 flex-shrink-0 mr-4 relative">
                        <img 
                          src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url} 
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                        {video.isShort || video.duration <= 60 ? (
                          <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded">쇼츠</div>
                        ) : (
                          <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">일반</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{video.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="mr-3">{formatNumber(parseInt(video.viewCount))} 조회수</span>
                          <span className="mr-3">{formatDate(video.publishedAt)}</span>
                          <span>{calculateEngagementRate(video.likeCount, video.commentCount, video.viewCount)}% 참여율</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Common Features Analysis */}
            {data.commonFeatures && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">공통 특성 분석</h3>
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
            
            {/* SEO Analysis */}
            {data.seoAnalysis && !hideSEOAnalysis && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">SEO 분석</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">제목 최적화</h4>
                        <div className="px-2 py-1 bg-yellow-100 rounded-md text-sm font-bold text-yellow-700">
                          {data.seoAnalysis.titleOptimization.score}/5
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold">{data.seoAnalysis.titleOptimization.average}</span>
                          <p className="text-xs text-gray-500">평균 길이</p>
                        </div>
                        <div className="flex-1 ml-4">
                          <p className="text-sm text-gray-600">{data.seoAnalysis.titleOptimization.recommendation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">설명 최적화</h4>
                        <div className="px-2 py-1 bg-yellow-100 rounded-md text-sm font-bold text-yellow-700">
                          {data.seoAnalysis.descriptionOptimization.score}/5
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold">{data.seoAnalysis.descriptionOptimization.average}</span>
                          <p className="text-xs text-gray-500">평균 길이</p>
                        </div>
                        <div className="flex-1 ml-4">
                          <p className="text-sm text-gray-600">{data.seoAnalysis.descriptionOptimization.recommendation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">해시태그 활용</h4>
                        <div className="px-2 py-1 bg-yellow-100 rounded-md text-sm font-bold text-yellow-700">
                          {data.seoAnalysis.hashtagUsage.score}/5
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold">{data.seoAnalysis.hashtagUsage.average}</span>
                          <p className="text-xs text-gray-500">평균 개수</p>
                        </div>
                        <div className="flex-1 ml-4">
                          <p className="text-sm text-gray-600">{data.seoAnalysis.hashtagUsage.recommendation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">키워드 일관성</h4>
                        <div className="px-2 py-1 bg-yellow-100 rounded-md text-sm font-bold text-yellow-700">
                          {data.seoAnalysis.keywordConsistency.score}/5
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">{data.seoAnalysis.keywordConsistency.recommendation}</p>
                        <div className="flex flex-wrap gap-2">
                          {data.seoAnalysis.keywordConsistency.topKeywords.map((keyword: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">업로드 전략</h4>
                        <div className="px-2 py-1 bg-yellow-100 rounded-md text-sm font-bold text-yellow-700">
                          {data.seoAnalysis.uploadStrategy.score}/5
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-24 text-center">
                          <span className="text-lg font-bold">{data.seoAnalysis.uploadStrategy.frequency}</span>
                          <p className="text-xs text-gray-500">평균 간격</p>
                        </div>
                        <div className="flex-1 ml-4">
                          <p className="text-sm text-gray-600">{data.seoAnalysis.uploadStrategy.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </Card>
    </div>
  );
}

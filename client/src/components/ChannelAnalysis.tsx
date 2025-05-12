import { Card, CardContent } from '@/components/ui/card';
import {
  formatNumber,
  formatMonthYear,
  calculateEngagementRate
} from '@/lib/youtube';
import { Chart } from '@/components/ui/chart';

interface ChannelAnalysisProps {
  data: any;
}

export default function ChannelAnalysis({ data }: ChannelAnalysisProps) {
  // Only proceed if we have valid channel info
  if (!data?.channelInfo) return null;

  const { channelInfo, videos } = data;
  const totalVideos = parseInt(channelInfo.statistics.videoCount || '0');
  const totalViews = parseInt(channelInfo.statistics.viewCount || '0');
  const totalSubs = parseInt(channelInfo.statistics.subscriberCount || '0');
  
  // Calculate total shorts vs regular videos
  const shortCount = videos.filter((v: any) => 
    v.isShort || v.duration <= 60
  ).length;
  
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

  // Data for pie chart
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
                      Regular ({Math.round(regularCount / totalVideos * 100) || 0}%)
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-[hsl(var(--chart-2))] inline-block rounded-sm mr-1"></span> 
                      Shorts ({Math.round(shortCount / totalVideos * 100) || 0}%)
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
            {data.topPerformingVideos && data.topPerformingVideos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Top 10 Performing Videos</h3>
                <div className="space-y-4">
                  {data.topPerformingVideos.map((video: any, index: number) => (
                    <div key={video.id} className="border border-gray-200 rounded-lg p-4 flex items-center">
                      <div className="text-2xl font-bold text-gray-400 mr-4">#{index + 1}</div>
                      <div className="w-20 h-20 flex-shrink-0 mr-4">
                        <img 
                          src={video.thumbnails?.medium?.url || video.thumbnails?.default?.url} 
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{video.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="mr-3">{formatNumber(parseInt(video.viewCount))} views</span>
                          <span>{formatDate(video.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
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
            {data.seoAnalysis && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">SEO 분석</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-medium text-gray-700">제목 최적화</h4>
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
                      <h4 className="font-medium text-gray-700">설명 최적화</h4>
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
                      <h4 className="font-medium text-gray-700">해시태그 활용</h4>
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
                      <h4 className="font-medium text-gray-700">키워드 일관성</h4>
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
                      <h4 className="font-medium text-gray-700">업로드 전략</h4>
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

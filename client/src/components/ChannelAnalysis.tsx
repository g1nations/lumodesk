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
          </div>
        </div>
      </Card>
    </div>
  );
}

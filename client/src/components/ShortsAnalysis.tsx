import { Card, CardContent } from '@/components/ui/card';
import { formatNumber, formatDate } from '@/lib/youtube';
import { Calendar, Eye, ThumbsUp } from 'lucide-react';

interface ShortsAnalysisProps {
  data: any;
}

export default function ShortsAnalysis({ data }: ShortsAnalysisProps) {
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
  
  // Sort shorts by view count to get top performers
  const topShorts = [...shortsVideos]
    .sort((a, b) => parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0))
    .slice(0, 3);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Shorts Analysis</h2>
      
      <Card>
        <CardContent className="p-6">
          {/* Shorts Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Shorts</p>
              <p className="text-2xl font-bold text-gray-800">{totalShorts}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Views</p>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(avgViews)}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-800">{avgDuration}s</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Upload Frequency</p>
              <p className="text-2xl font-bold text-gray-800">{data.shortsFrequency || 'N/A'}</p>
            </div>
          </div>
          
          {/* Top Performing Shorts */}
          <h3 className="text-lg font-medium mb-4">Top Performing Shorts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topShorts.map((short: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
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
        </CardContent>
      </Card>
    </div>
  );
}

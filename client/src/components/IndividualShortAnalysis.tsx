import { Card, CardContent } from '@/components/ui/card';
import { formatNumber, formatDate } from '@/lib/youtube';
import { Calendar, Play, Eye, ThumbsUp, MessageSquare, Download, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
          </div>
        </div>
      </Card>
    </div>
  );
}

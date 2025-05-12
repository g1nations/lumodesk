import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatNumber } from '@/lib/youtube';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Eye, BarChart, Smartphone, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisHistory } from '@shared/schema';

export default function History() {
  const { data, isLoading, isError, error } = useQuery<AnalysisHistory[]>({
    queryKey: ['/api/history'],
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analyzer
          </Button>
        </Link>
        <div className="flex items-center justify-center mb-2">
          <svg className="text-[#FF0000] w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Analysis History</h1>
        </div>
        <p className="text-center text-gray-600 text-lg">Previous YouTube analysis results</p>
      </header>

      {/* History List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))
        )}
        
        {isError && (
          <div className="col-span-full bg-red-50 text-red-800 p-4 rounded-lg">
            <p className="font-medium">Error loading history</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        )}
        
        {data && data.length === 0 && (
          <div className="col-span-full bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">No Analysis History Yet</h3>
            <p>Analyze a YouTube channel or shorts to save it in your history.</p>
            <Link to="/">
              <Button className="mt-4 bg-[#FF0000] hover:bg-[#CC0000]">
                Start Analyzing
              </Button>
            </Link>
          </div>
        )}
        
        {data && data.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/analysis/${item.id}`}>
              <div className="aspect-video bg-gray-100 relative">
                {item.thumbnailUrl ? (
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {item.type === 'channel' && <BarChart className="h-12 w-12 text-gray-400" />}
                    {item.type === 'channel_shorts' && <Smartphone className="h-12 w-12 text-gray-400" />}
                    {item.type === 'shorts' && <Film className="h-12 w-12 text-gray-400" />}
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex justify-between text-white text-xs">
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {formatNumber(parseInt(item.viewCount || '0'))}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.type === 'channel' ? 'bg-blue-500 text-white' : 
                    item.type === 'channel_shorts' ? 'bg-purple-500 text-white' : 
                    'bg-red-500 text-white'
                  }`}>
                    {item.type === 'channel' ? 'Channel' : 
                     item.type === 'channel_shorts' ? 'Shorts Channel' : 
                     'Short Video'}
                  </span>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {item.url}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Analyzed on {formatDate(item.createdAt)}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 pb-8">
        <p>MockTube Scanner • Beta Version</p>
        <p className="mt-1">Not affiliated with YouTube. Created for content creators and marketers.</p>
      </footer>
    </div>
  );
}
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ChannelAnalysis from '@/components/ChannelAnalysis';
import ShortsAnalysis from '@/components/ShortsAnalysis';
import IndividualShortAnalysis from '@/components/IndividualShortAnalysis';
import { AnalysisHistory } from '@shared/schema';

export default function AnalysisDetail() {
  const { id } = useParams();
  
  const { data, isLoading, isError, error } = useQuery<AnalysisHistory>({
    queryKey: [`/api/history/${id}`],
  });
  
  const downloadAnalysis = () => {
    if (!data) return;
    
    const jsonString = JSON.stringify(data.resultData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${data.youtubeId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const renderAnalysisContent = () => {
    if (!data || !data.resultData) return null;
    
    const resultData = data.resultData as any;
    
    switch (resultData.type) {
      case 'channel':
        return <ChannelAnalysis data={resultData} />;
      case 'channel_shorts':
        return (
          <>
            <ChannelAnalysis data={resultData} />
            <ShortsAnalysis data={resultData} />
          </>
        );
      case 'shorts':
        return <IndividualShortAnalysis data={resultData} />;
      default:
        return <div>Unknown analysis type</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header with back button */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link to="/history">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
          
          {data && (
            <Button 
              variant="outline" 
              className="flex items-center" 
              onClick={downloadAnalysis}
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Skeleton className="h-10 w-2/3 mb-2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ) : isError ? (
          <div className="text-center text-red-600">
            <h1 className="text-2xl font-bold">Error Loading Analysis</h1>
            <p className="mt-2">{(error as Error).message}</p>
          </div>
        ) : data ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">{data.title}</h1>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Analyzed on {new Date(data.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ) : null}
      </header>

      {/* Loading state */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex justify-center">
            <div className="spinner"></div>
            <span className="ml-3 text-lg font-medium text-gray-700">Loading analysis...</span>
          </div>
        </Card>
      )}
      
      {/* Error state */}
      {isError && (
        <Card className="bg-red-50 border border-red-200 p-6">
          <div className="text-center text-red-800">
            <h3 className="text-lg font-bold mb-2">Failed to Load Analysis</h3>
            <p>{(error as Error).message}</p>
            <Link to="/history">
              <Button className="mt-4 bg-red-600 hover:bg-red-700">
                Return to History
              </Button>
            </Link>
          </div>
        </Card>
      )}
      
      {/* Content */}
      {data && renderAnalysisContent()}
      
      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 pb-8">
        <p>MockTube Scanner • Beta Version</p>
        <p className="mt-1">Not affiliated with YouTube. Created for content creators and marketers.</p>
      </footer>
    </div>
  );
}
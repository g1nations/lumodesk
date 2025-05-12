import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="bg-red-50 border border-red-200 text-red-800 mb-8">
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        </div>
        <h3 className="text-lg font-bold mb-2">Analysis Error</h3>
        <p className="text-red-600 mb-4">{message || 'We couldn\'t analyze this URL. Please check that it\'s a valid YouTube URL.'}</p>
        <Button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

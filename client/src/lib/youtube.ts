// Local storage key for the YouTube API key
export const API_KEY_STORAGE_KEY = 'mocktube-api-key';
export const QWQ_API_KEY_STORAGE_KEY = 'mocktube-qwq-api-key';

// URL parsing and validation functions
export function parseYouTubeUrl(url: string): { 
  type: 'channel' | 'username' | 'custom' | 'video' | 'shorts' | null; 
  id: string | null; 
  isShorts: boolean;
} {
  try {
    // URL validation
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
      throw new Error('Not a YouTube URL');
    }
    
    let result = {
      type: null as 'channel' | 'username' | 'custom' | 'video' | 'shorts' | null,
      id: null as string | null,
      isShorts: false
    };
    
    // Channel ID format (/channel/UC...)
    if (url.includes('/channel/')) {
      result.type = 'channel';
      result.id = url.split('/channel/')[1].split('/')[0].split('?')[0];
      
      // Check if it's a channel's Shorts section
      if (url.includes('/shorts')) {
        result.isShorts = true;
      }
      return result;
    }
    
    // Username format (/@username)
    if (url.includes('/@')) {
      result.type = 'username';
      result.id = url.split('/@')[1].split('/')[0].split('?')[0];
      
      // Check if it's a channel's Shorts section
      if (url.includes('/shorts')) {
        result.isShorts = true;
      }
      return result;
    }
    
    // Legacy custom URL (/c/customname)
    if (url.includes('/c/')) {
      result.type = 'custom';
      result.id = url.split('/c/')[1].split('/')[0].split('?')[0];
      
      // Check if it's a channel's Shorts section
      if (url.includes('/shorts')) {
        result.isShorts = true;
      }
      return result;
    }
    
    // Single video URL - standard format
    if (url.includes('/watch?v=')) {
      result.type = 'video';
      result.id = new URLSearchParams(urlObj.search).get('v');
      return result;
    }
    
    // Single video URL - short format
    if (url.includes('youtu.be/')) {
      result.type = 'video';
      result.id = url.split('youtu.be/')[1].split('/')[0].split('?')[0];
      return result;
    }
    
    // Shorts video URL
    if (url.includes('/shorts/')) {
      result.type = 'shorts';
      result.id = url.split('/shorts/')[1].split('/')[0].split('?')[0];
      return result;
    }
    
    throw new Error('Unsupported YouTube URL format');
  } catch (error: any) {
    if (error.message === 'Invalid URL') {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

// Format large numbers for display (e.g. 1200000 -> 1.2M)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Calculate time difference as a string (e.g. "3.5 days", "2 weeks")
export function calculateUploadFrequency(dates: string[]): string {
  if (dates.length < 2) {
    return 'N/A';
  }

  const sortedDates = [...dates].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
  
  let totalDays = 0;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diffTime = sortedDates[i].getTime() - sortedDates[i + 1].getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    totalDays += diffDays;
  }
  
  const avgDays = totalDays / (sortedDates.length - 1);
  
  if (avgDays < 1) {
    return `${(avgDays * 24).toFixed(1)} hours`;
  } else if (avgDays < 7) {
    return `${avgDays.toFixed(1)} days`;
  } else if (avgDays < 30) {
    return `${(avgDays / 7).toFixed(1)} weeks`;
  } else {
    return `${(avgDays / 30).toFixed(1)} months`;
  }
}

// Extract hashtags from text
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
}

// Format date for display (e.g. "Jan 1, 2020")
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date for display with just month and year (e.g. "Jan 2020")
export function formatMonthYear(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short'
  });
}

// Parse ISO 8601 duration format (PT1M30S etc.)
export function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Format seconds to a readable duration (e.g. "1:30")
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Check if a video is a Short (≤60s)
export function isShort(duration: string): boolean {
  return parseIsoDuration(duration) <= 60;
}

// Calculate engagement rate: (likes + comments) / views * 100
export function calculateEngagementRate(
  views: number, 
  likes: number, 
  comments: number
): string {
  if (views === 0) return '0%';
  return ((likes + comments) / views * 100).toFixed(2) + '%';
}

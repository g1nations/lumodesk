import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  parseYouTubeUrl, 
  getChannelById, 
  getChannelByUsername, 
  getChannelVideos, 
  analyzeShortsVideo 
} from "./youtube";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for analyzing YouTube URLs
  app.post('/api/analyze', async (req, res) => {
    try {
      const { url, apiKey } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }
      
      if (!apiKey) {
        return res.status(400).json({ message: 'YouTube API key is required' });
      }
      
      // Parse YouTube URL
      const parsedUrl = parseYouTubeUrl(url);
      
      // Process based on URL type
      if (parsedUrl.type === 'channel' || parsedUrl.type === 'username' || parsedUrl.type === 'custom') {
        let channelData;
        
        // Get channel info by ID or username
        if (parsedUrl.type === 'channel') {
          channelData = await getChannelById(parsedUrl.id!, apiKey);
        } else {
          channelData = await getChannelByUsername(parsedUrl.id!, apiKey);
        }
        
        // Get channel's videos or Shorts
        const videos = await getChannelVideos(
          channelData.id, 
          apiKey,
          10, 
          parsedUrl.isShorts
        );
        
        // Extract upload dates for frequency calculation
        const uploadDates = videos.map((v: any) => v.snippet.publishedAt);
        
        // Calculate upload frequency
        const uploadFrequency = calculateUploadFrequency(uploadDates);
        
        // Extract hashtags from video titles and descriptions
        const allHashtags = extractAllHashtags(videos);
        
        // Create channel analysis result
        const result = {
          type: parsedUrl.isShorts ? 'channel_shorts' : 'channel',
          channelInfo: {
            id: channelData.id,
            snippet: channelData.snippet,
            statistics: channelData.statistics,
            contentDetails: channelData.contentDetails
          },
          videos: videos.map((video: any) => ({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnails: video.snippet.thumbnails,
            viewCount: video.statistics?.viewCount || '0',
            likeCount: video.statistics?.likeCount || '0',
            commentCount: video.statistics?.commentCount || '0',
            duration: parseIsoDuration(video.contentDetails.duration),
            isShort: isShort(video.contentDetails.duration),
            hashtags: extractHashtags(video.snippet.title + ' ' + video.snippet.description)
          })),
          uploadFrequency,
          popularHashtags: allHashtags.slice(0, 8),
          shortsFrequency: calculateUploadFrequency(
            videos
              .filter((v: any) => isShort(v.contentDetails.duration))
              .map((v: any) => v.snippet.publishedAt)
          )
        };
        
        return res.json(result);
      } else if (parsedUrl.type === 'shorts' || parsedUrl.type === 'video') {
        // Analyze individual video/short
        const videoAnalysis = await analyzeShortsVideo(parsedUrl.id!, apiKey);
        
        return res.json({
          type: 'shorts',
          videoInfo: videoAnalysis
        });
      } else {
        return res.status(400).json({ message: 'Unsupported YouTube URL format' });
      }
    } catch (error: any) {
      console.error('Error analyzing YouTube URL:', error);
      return res.status(400).json({ message: error.message || 'Failed to analyze YouTube URL' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate upload frequency
function calculateUploadFrequency(dates: string[]): string {
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

// Helper function to extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
}

// Helper function to extract and count all hashtags from videos
function extractAllHashtags(videos: any[]): string[] {
  // Extract hashtags from all video titles and descriptions
  const hashtagMap = new Map<string, number>();
  
  videos.forEach(video => {
    const text = video.snippet.title + ' ' + video.snippet.description;
    const hashtags = extractHashtags(text);
    
    hashtags.forEach(tag => {
      hashtagMap.set(tag, (hashtagMap.get(tag) || 0) + 1);
    });
  });
  
  // Sort by frequency
  return [...hashtagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

// Parse ISO 8601 duration format (PT1M30S etc.)
function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Check if a video is a Short (≤60s)
function isShort(duration: string): boolean {
  return parseIsoDuration(duration) <= 60;
}

import { google } from 'googleapis';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Parse YouTube URL and determine analysis type
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

// Get channel info by ID
export async function getChannelById(channelId: string, apiKey: string) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails', 'brandingSettings'],
      id: [channelId]
    });
    
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0];
    }
    throw new Error('Channel not found');
  } catch (error: any) {
    console.error('Error fetching channel info:', error);
    throw new Error(`Error fetching channel info: ${error.message}`);
  }
}

// Get channel info by username
export async function getChannelByUsername(username: string, apiKey: string) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    // First try searching for the channel
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: username,
      type: ['channel'],
      maxResults: 1
    });
    
    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const channelId = searchResponse.data.items[0].snippet?.channelId;
      if (channelId) {
        return getChannelById(channelId, apiKey);
      }
    }
    
    throw new Error('Channel not found for this username');
  } catch (error: any) {
    console.error('Error fetching channel by username:', error);
    throw new Error(`Error fetching channel: ${error.message}`);
  }
}

// Get channel's videos
export async function getChannelVideos(
  channelId: string, 
  apiKey: string, 
  maxResults = 10, 
  onlyShorts = false
) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    // Get channel's uploads playlist ID
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId]
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found');
    }
    
    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error('Cannot find uploads playlist');
    }
    
    // Get videos from uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 50 // Max allowed by API
    });
    
    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return [];
    }
    
    // Extract video IDs
    const videoIds = playlistResponse.data.items.map(
      item => item.contentDetails?.videoId
    ).filter(Boolean) as string[];
    
    // Get detailed video info
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds
    });
    
    let videos = videosResponse.data.items || [];
    
    // Filter Shorts if needed
    if (onlyShorts) {
      videos = videos.filter(video => {
        if (!video?.contentDetails?.duration) return false;
        
        // Shorts characteristics: vertical video (9:16 ratio), ≤60s
        const duration = video.contentDetails.duration;
        // Parse ISO 8601 duration format (PT1M30S etc.)
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return false;
        
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // ≤60s, or has #shorts tag
        return (totalSeconds <= 60) || 
              (video.snippet?.tags && video.snippet.tags.includes('shorts')) || 
              (video.snippet?.description && video.snippet.description.toLowerCase().includes('#shorts'));
      });
    }
    
    // Return max results
    return videos.slice(0, maxResults);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    throw new Error(`Error fetching videos: ${error.message}`);
  }
}

// Analyze individual Shorts video
export async function analyzeShortsVideo(videoId: string, apiKey: string) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    // 1. Get basic video info
    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId]
    });
    
    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const videoData = videoResponse.data.items[0];
    
    // Extract hashtags
    let hashtags: string[] = [];
    const description = videoData.snippet?.description || '';
    
    // Extract hashtags from description
    const hashtagRegex = /#[\w\u0080-\uFFFF]+/g;
    const matches = description.match(hashtagRegex);
    if (matches) {
      hashtags = [...new Set(matches)]; // Remove duplicates
    }
    
    // Extract hashtags from title
    const title = videoData.snippet?.title || '';
    const titleMatches = title.match(hashtagRegex);
    if (titleMatches) {
      hashtags = [...new Set([...hashtags, ...titleMatches])]; // Merge and remove duplicates
    }
    
    // Try to get captions availability
    let captionsAvailable = false;
    try {
      const captionResponse = await youtube.captions.list({
        part: ['snippet'],
        videoId
      });
      captionsAvailable = captionResponse.data.items !== undefined && captionResponse.data.items.length > 0;
    } catch (e) {
      // Captions API might require additional permissions
      console.log('Could not check captions:', e);
    }
    
    return {
      id: videoId,
      title: videoData.snippet?.title,
      description: videoData.snippet?.description,
      publishedAt: videoData.snippet?.publishedAt,
      channelId: videoData.snippet?.channelId,
      channelTitle: videoData.snippet?.channelTitle,
      viewCount: videoData.statistics?.viewCount,
      likeCount: videoData.statistics?.likeCount,
      commentCount: videoData.statistics?.commentCount,
      duration: videoData.contentDetails?.duration,
      thumbnails: videoData.snippet?.thumbnails,
      hashtags: hashtags,
      captionsAvailable: captionsAvailable,
      transcriptNote: "YouTube API restrictions prevent direct transcript access. Use YouTube Studio or captions.list API with proper authorization for full transcript access."
    };
  } catch (error: any) {
    console.error('Error analyzing Shorts video:', error);
    throw new Error(`Error analyzing Shorts video: ${error.message}`);
  }
}

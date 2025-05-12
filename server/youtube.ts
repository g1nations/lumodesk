import { google } from 'googleapis';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

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
    let captionTracks: { languageCode: string; languageName: string; name: string; id: string }[] = [];
    
    try {
      const captionResponse = await youtube.captions.list({
        part: ['snippet'],
        videoId
      });
      
      if (captionResponse.data.items && captionResponse.data.items.length > 0) {
        captionsAvailable = true;
        captionTracks = captionResponse.data.items.map(caption => ({
          languageCode: caption.snippet?.language || '',
          languageName: caption.snippet?.name || '',
          name: caption.snippet?.trackKind || '',
          id: caption.id || ''
        }));
      }
    } catch (e) {
      // Try alternative method if the captions.list API fails
      // This is a fallback since captions.list requires additional permissions
      try {
        // Fetch the video page to check for captions availability
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await axios.get(videoUrl);
        const html = response.data;
        
        // Check if captions are mentioned in the page
        if (html.includes('"playerCaptionsTracklistRenderer"') || 
            html.includes('"captionTracks"')) {
          captionsAvailable = true;
          
          // Try to extract caption track info
          const captionTrackMatch = html.match(/"captionTracks":\[(.*?)\]/);
          if (captionTrackMatch && captionTrackMatch[1]) {
            const captionTrackJson = `[${captionTrackMatch[1]}]`;
            try {
              const parsed = JSON.parse(captionTrackJson);
              captionTracks = parsed.map((track: any) => ({
                languageCode: track.languageCode || '',
                languageName: track.name?.simpleText || '',
                name: track.name?.simpleText || '',
                id: track.baseUrl || '' // Use baseUrl as ID for downloading
              }));
            } catch (jsonError) {
              console.error('Failed to parse caption tracks:', jsonError);
            }
          }
        }
      } catch (scrapeError) {
        console.error('Failed to scrape video page for captions:', scrapeError);
      }
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
      captionTracks: captionTracks,
      transcriptNote: captionsAvailable 
        ? "Captions are available for this video. You can download them from the UI."
        : "No captions are available for this video."
    };
  } catch (error: any) {
    console.error('Error analyzing Shorts video:', error);
    throw new Error(`Error analyzing Shorts video: ${error.message}`);
  }
}

// Get captions for a video
export async function getCaptions(videoId: string, lang = 'en') {
  try {
    // First try to get the video page to extract caption info
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await axios.get(videoUrl);
    const html = response.data;
    
    // Check if captions are available
    if (!html.includes('"captionTracks"')) {
      throw new Error('No captions available for this video');
    }
    
    // Extract caption track URLs
    const captionTrackMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionTrackMatch || !captionTrackMatch[1]) {
      throw new Error('Failed to extract caption track information');
    }
    
    const captionTrackJson = `[${captionTrackMatch[1]}]`;
    const captionTracks = JSON.parse(captionTrackJson);
    
    // Find the caption track for the requested language
    let captionTrack = captionTracks.find((track: any) => track.languageCode === lang);
    
    // If the requested language isn't available, use the first track
    if (!captionTrack && captionTracks.length > 0) {
      captionTrack = captionTracks[0];
    }
    
    if (!captionTrack || !captionTrack.baseUrl) {
      throw new Error(`Caption track for language ${lang} not found`);
    }
    
    // Get the caption file (in XML format)
    const captionResponse = await axios.get(captionTrack.baseUrl);
    const captionXml = captionResponse.data;
    
    // Parse the XML to extract the captions
    const $ = cheerio.load(captionXml, { xmlMode: true });
    const captionData = $('transcript text').map((_, elem) => {
      const $elem = $(elem);
      return {
        start: parseFloat($elem.attr('start') || '0'),
        duration: parseFloat($elem.attr('dur') || '0'),
        text: $elem.text()
      };
    }).get();
    
    // Return the caption data and metadata
    return {
      captions: captionData,
      metadata: {
        language: captionTrack.languageCode,
        languageName: captionTrack.name?.simpleText || captionTrack.languageCode,
        isAutoGenerated: captionTrack.kind === 'asr'
      }
    };
  } catch (error: any) {
    console.error('Error getting captions:', error);
    throw new Error(`Failed to get captions: ${error.message}`);
  }
}

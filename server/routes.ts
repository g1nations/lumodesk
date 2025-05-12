import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  parseYouTubeUrl, 
  getChannelById, 
  getChannelByUsername, 
  getChannelVideos, 
  analyzeShortsVideo,
  getCaptions
} from "./youtube";
import { analyzeSEO, generateParody, analyzeCaptionOptimization } from "./ai";
import { InsertAnalysisHistory } from "@shared/schema";

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
          20, // 더 많은 비디오를 가져와서 분석 대상을 늘림
          parsedUrl.isShorts
        );
        
        // Extract upload dates for frequency calculation
        const uploadDates = videos.map((v: any) => v.snippet.publishedAt);
        
        // Calculate upload frequency
        const uploadFrequency = calculateUploadFrequency(uploadDates);
        
        // Extract hashtags from video titles and descriptions
        const allHashtags = extractAllHashtags(videos);
        
        // 각 비디오에 대한 기본 처리
        const processedVideos = videos.map((video: any) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          duration: parseIsoDuration(video.contentDetails.duration),
          isShort: isShort(video.contentDetails.duration),
          hashtags: extractHashtags(video.snippet.title + ' ' + video.snippet.description)
        }));

        // SEO 분석 준비
        const titleLengths = processedVideos.map(v => v.title.length);
        const descriptionLengths = processedVideos.map(v => v.description.length);
        const hashtagCounts = processedVideos.map(v => v.hashtags.length);
        
        // 성공적인 비디오 분석 (View 기준 상위 비디오)
        const topPerformingVideos = [...processedVideos]
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, 10);
          
        // 성공적인 비디오의 공통적인 특징 분석
        const commonFeatures = {
          titleLength: {
            average: Math.round(topPerformingVideos.reduce((sum, v) => sum + v.title.length, 0) / topPerformingVideos.length),
            range: `${Math.min(...topPerformingVideos.map(v => v.title.length))} - ${Math.max(...topPerformingVideos.map(v => v.title.length))}`
          },
          descriptionLength: {
            average: Math.round(topPerformingVideos.reduce((sum, v) => sum + v.description.length, 0) / topPerformingVideos.length),
            range: `${Math.min(...topPerformingVideos.map(v => v.description.length))} - ${Math.max(...topPerformingVideos.map(v => v.description.length))}`
          },
          hashtagCount: {
            average: (topPerformingVideos.reduce((sum, v) => sum + v.hashtags.length, 0) / topPerformingVideos.length).toFixed(1),
            range: `${Math.min(...topPerformingVideos.map(v => v.hashtags.length))} - ${Math.max(...topPerformingVideos.map(v => v.hashtags.length))}`
          },
          commonWords: findCommonWords(topPerformingVideos.map(v => v.title + ' ' + v.description)),
          commonHashtags: findCommonHashtags(topPerformingVideos.map(v => v.hashtags))
        };
        
        // 쇼츠 여부 확인 (채널의 모든 비디오의 50% 이상이 쇼츠인 경우 쇼츠 채널로 간주)
        const shortsCount = processedVideos.filter(v => v.isShort).length;
        const isMainlyShorts = shortsCount / processedVideos.length >= 0.5;
        
        // 개선된 SEO 분석 - 계산된 점수 사용
        const titleScore = calculateTitleScore(titleLengths, isMainlyShorts);
        const descriptionScore = calculateDescriptionScore(descriptionLengths, isMainlyShorts);
        const hashtagScore = calculateHashtagScore(hashtagCounts, isMainlyShorts);
        const keywordScore = calculateKeywordConsistencyScore(processedVideos.map(v => v.title + ' ' + v.description), isMainlyShorts);
        const uploadScore = calculateUploadStrategyScore(processedVideos.map(v => new Date(v.publishedAt)));
        
        // 평균 점수 계산
        const overallScore = Math.round((titleScore + descriptionScore + hashtagScore + keywordScore + uploadScore) / 5 * 10) / 10;
        
        const seoAnalysis = {
          titleOptimization: {
            average: Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length),
            recommendation: isMainlyShorts
              ? "Shorts 최적 제목 길이는 30-50자입니다. 호기심을 자극하는 핵심 키워드를 포함하세요."
              : "YouTube 검색을 위한 최적 제목 길이는 60-70자입니다. 제목에 핵심 키워드를 포함하세요.",
            score: titleScore // 제목 최적화 점수 (5점 만점)
          },
          descriptionOptimization: {
            average: Math.round(descriptionLengths.reduce((a, b) => a + b, 0) / descriptionLengths.length),
            recommendation: isMainlyShorts
              ? "Shorts는 30-100자의 간결한 설명과 1-2개의 핵심 해시태그가 효과적입니다."
              : "일반 동영상은 설명란에 최소 200자 이상이 권장됩니다. 핵심 키워드를 2-3회 포함하고 자연스럽게 작성하세요.",
            score: descriptionScore // 설명 최적화 점수 (5점 만점)
          },
          hashtagUsage: {
            average: (hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length).toFixed(1),
            recommendation: "3-5개의 관련성 높은 해시태그가 최적입니다. 트렌딩 해시태그와 구체적인 니치 해시태그를 조합하세요.",
            score: hashtagScore // 해시태그 활용 점수 (5점 만점)
          },
          keywordConsistency: {
            topKeywords: findTopKeywords(processedVideos.map(v => v.title + ' ' + v.description)),
            recommendation: "채널 전체에서 일관된 키워드를 사용하면 유튜브 알고리즘이 채널의 주제를 파악하는 데 도움이 됩니다.",
            score: keywordScore // 키워드 일관성 점수 (5점 만점)
          },
          uploadStrategy: {
            frequency: uploadFrequency,
            recommendation: "일관된 업로드 일정은 시청자 참여도와 알고리즘 노출을 높이는 데 중요합니다.",
            score: uploadScore // 업로드 전략 점수 (5점 만점)
          },
          overallScore: overallScore // 전체 SEO 점수 (5점 만점)
        };
        
        const result = {
          type: parsedUrl.isShorts ? 'channel_shorts' : 'channel',
          channelInfo: {
            id: channelData.id,
            snippet: channelData.snippet,
            statistics: channelData.statistics,
            contentDetails: channelData.contentDetails
          },
          videos: processedVideos.map(v => ({
            ...v,
            viewCount: v.viewCount.toString(),
            likeCount: v.likeCount.toString(),
            commentCount: v.commentCount.toString()
          })),
          uploadFrequency,
          popularHashtags: allHashtags.slice(0, 8),
          shortsFrequency: calculateUploadFrequency(
            videos
              .filter((v: any) => isShort(v.contentDetails.duration))
              .map((v: any) => v.snippet.publishedAt)
          ),
          topPerformingVideos: topPerformingVideos.map(v => ({
            ...v,
            viewCount: v.viewCount.toString(),
            likeCount: v.likeCount.toString(),
            commentCount: v.commentCount.toString()
          })),
          commonFeatures,
          seoAnalysis
        };
        
        // Save analysis to database
        try {
          const analysisEntry: InsertAnalysisHistory = {
            url,
            youtubeId: channelData.id,
            type: result.type,
            title: channelData.snippet.title,
            thumbnailUrl: channelData.snippet.thumbnails?.high?.url || channelData.snippet.thumbnails?.medium?.url || '',
            viewCount: channelData.statistics?.viewCount || '0',
            resultData: result as any,
            apiKey
          };
          
          await storage.saveAnalysis(analysisEntry);
        } catch (dbError) {
          console.error('Error saving analysis to database:', dbError);
          // Continue even if saving to DB fails - don't block the response
        }
        
        return res.json(result);
      } else if (parsedUrl.type === 'shorts' || parsedUrl.type === 'video') {
        // Analyze individual video/short
        const videoAnalysis = await analyzeShortsVideo(parsedUrl.id!, apiKey);
        
        // 단일 쇼츠 영상에 대한 SEO 분석
        const titleLength = videoAnalysis.title?.length || 0;
        const descriptionLength = videoAnalysis.description?.length || 0;
        const hashtagCount = videoAnalysis.hashtags?.length || 0;
        
        // 개선된 점수 계산 함수 사용
        const titleScore = calculateTitleScore([titleLength], true); // true = Shorts
        const descriptionScore = calculateDescriptionScore([descriptionLength], true);
        const hashtagScore = calculateHashtagScore([hashtagCount], true);
        
        // 영상이 하나라 키워드 일관성과 업로드 전략은 평가하기 어려움
        const keywordScore = 3.0; // 기본값
        const uploadScore = 3.0; // 기본값
        
        // 평균 점수 계산
        const overallScore = Math.round((titleScore + descriptionScore + hashtagScore + keywordScore + uploadScore) / 5 * 10) / 10;
        
        // SEO 분석 추가
        const seoAnalysis = {
          titleOptimization: {
            length: titleLength,
            score: titleScore,
            recommendation: "Shorts 최적 제목 길이는 30-50자입니다. 호기심을 자극하는 핵심 키워드를 포함하세요."
          },
          descriptionOptimization: {
            length: descriptionLength,
            score: descriptionScore,
            recommendation: "Shorts는 30-100자의 간결한 설명과 1-2개의 핵심 해시태그가 효과적입니다."
          },
          hashtagUsage: {
            count: hashtagCount,
            score: hashtagScore,
            recommendation: "Shorts에는 3-5개의 관련성 높은 해시태그가 최적입니다. 트렌딩 해시태그와 니치 해시태그를 조합하세요."
          },
          keywordConsistency: {
            score: keywordScore,
            recommendation: "제목과 설명에 일관된 키워드를 포함시키고, 첫 문장에 핵심 키워드를 배치하세요."
          },
          uploadStrategy: {
            score: uploadScore,
            recommendation: "일관된 업로드 주기를 유지하고 시청자 참여도가 높은 시간대에 업로드하세요."
          },
          overallScore: overallScore
        };
        
        const result = {
          type: 'shorts',
          videoInfo: videoAnalysis,
          seoAnalysis
        };
        
        // Save analysis to database
        try {
          const analysisEntry: InsertAnalysisHistory = {
            url,
            youtubeId: videoAnalysis.id,
            type: 'shorts',
            title: videoAnalysis.title || '',
            thumbnailUrl: videoAnalysis.thumbnails?.high?.url || videoAnalysis.thumbnails?.medium?.url || '',
            viewCount: videoAnalysis.viewCount || '0',
            resultData: result as any,
            apiKey
          };
          
          await storage.saveAnalysis(analysisEntry);
        } catch (dbError) {
          console.error('Error saving analysis to database:', dbError);
          // Continue even if saving to DB fails - don't block the response
        }
        
        return res.json(result);
      } else {
        return res.status(400).json({ message: 'Unsupported YouTube URL format' });
      }
    } catch (error: any) {
      console.error('Error analyzing YouTube URL:', error);
      return res.status(400).json({ message: error.message || 'Failed to analyze YouTube URL' });
    }
  });
  
  // Get recent analyses
  app.get('/api/history', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const analyses = await storage.getRecentAnalyses(limit);
      return res.json(analyses);
    } catch (error: any) {
      console.error('Error fetching analysis history:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch analysis history' });
    }
  });
  
  // Get analysis by ID
  app.get('/api/history/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }
      
      return res.json(analysis);
    } catch (error: any) {
      console.error('Error fetching analysis:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch analysis' });
    }
  });
  
  // Get captions for a video
  app.get('/api/captions/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const langParam = req.query.lang || 'en';
      const language = langParam as string;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }
      
      const captionsData = await getCaptions(videoId, language);
      
      // 일관된 응답 형식 제공
      if (Array.isArray(captionsData)) {
        // 이전 포맷을 새 포맷으로 변환
        return res.json({ 
          captions: captionsData,
          metadata: {
            language: language,
            videoId: videoId
          }
        });
      } else {
        // 이미 새 포맷인 경우
        return res.json(captionsData);
      }
    } catch (error: any) {
      console.error('Error fetching captions:', error);
      // 캡션이 없는 경우도 정상적인 응답 형식으로 반환
      return res.json({ 
        captions: [],
        metadata: {
          language: language,
          videoId: videoId,
          error: error.message || 'Failed to fetch captions'
        }
      });
    }
  });
  
  // Download captions as SRT format
  app.get('/api/captions/:videoId/download', async (req, res) => {
    try {
      const { videoId } = req.params;
      const langParam = req.query.lang || 'en';
      const language = langParam as string;
      const format = req.query.format || 'srt'; // srt, txt, json
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }
      
      // 캡션 데이터 가져오기
      const captionDataResult = await getCaptions(videoId, language);
      
      // 캡션 데이터 형식 정규화
      let captions: any[] = [];
      
      if (Array.isArray(captionDataResult)) {
        // 구 형식 캡션 데이터
        captions = captionDataResult;
      } else if (captionDataResult && Array.isArray(captionDataResult.captions)) {
        // 신 형식 캡션 데이터
        captions = captionDataResult.captions;
      }
      
      // 캡션이 없는 경우
      if (!captions || captions.length === 0) {
        if (format === 'json') {
          return res.json({
            captions: [],
            metadata: {
              videoId: videoId,
              language: language,
              message: "No captions available for this video"
            }
          });
        } else {
          res.setHeader('Content-Type', 'text/plain');
          return res.send("No captions available for this video");
        }
      }
      
      // Format as SRT
      if (format === 'srt') {
        let srtContent = '';
        captions.forEach((caption, index) => {
          const startTime = formatSrtTime(caption.start);
          const endTime = formatSrtTime(caption.start + caption.duration);
          
          srtContent += `${index + 1}\n`;
          srtContent += `${startTime} --> ${endTime}\n`;
          srtContent += `${caption.text}\n\n`;
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=${videoId}_${language}.srt`);
        return res.send(srtContent);
      }
      
      // Format as plain text
      if (format === 'txt') {
        let textContent = '';
        captions.forEach(caption => {
          textContent += `${caption.text}\n`;
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=${videoId}_${language}.txt`);
        return res.send(textContent);
      }
      
      // Default to JSON
      const formattedData = {
        captions,
        metadata: {
          videoId: videoId,
          language: language,
          count: captions.length
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${videoId}_${language}.json`);
      res.json(formattedData);
    } catch (error: any) {
      console.error('Error downloading captions:', error);
      
      // 에러 발생 시에도 포맷에 맞게 응답
      if (req.query.format === 'json') {
        return res.json({ 
          captions: [],
          metadata: {
            videoId: videoId,
            language: language,
            error: error.message || 'Failed to download captions'
          }
        });
      } else {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(`Error: ${error.message || 'Failed to download captions'}`);
      }
    }
  });
  
  // AI를 활용한 SEO 분석 API 엔드포인트
  app.post('/api/analyze-seo', async (req, res) => {
    try {
      const { title, description, tags, apiKey, model, language } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenRouter API key is required' });
      }
      
      if (!title) {
        return res.status(400).json({ error: 'Video title is required' });
      }
      
      const seoAnalysis = await analyzeSEO(
        title, 
        description || '', 
        tags || [], 
        apiKey,
        model,
        language || 'en'
      );
      
      return res.json({ seoAnalysis });
    } catch (error: any) {
      console.error('Error analyzing SEO:', error);
      return res.status(500).json({ error: error.message || 'Error analyzing SEO' });
    }
  });
  
  // AI를 활용한 캡션 분석 API 엔드포인트
  app.post('/api/analyze-caption', async (req, res) => {
    try {
      const { caption, apiKey, model, language } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenRouter API key is required' });
      }
      
      if (!caption) {
        return res.status(400).json({ error: 'Caption text is required' });
      }
      
      const captionAnalysis = await analyzeCaptionOptimization(
        caption,
        apiKey,
        model,
        language || 'en'
      );
      
      return res.json({ captionAnalysis });
    } catch (error: any) {
      console.error('Error analyzing caption:', error);
      return res.status(500).json({ error: error.message || 'Error analyzing caption' });
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

// Format seconds to SRT time format (HH:MM:SS,mmm)
function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// 텍스트 배열에서 공통 단어 찾기 (제목과 설명)
function findCommonWords(texts: string[]): string[] {
  // 불용어 (stopwords) 목록 - 분석에서 제외할 흔한 단어들
  const stopwords = new Set([
    'the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'this', 'by', 'are', 'was', 'be',
    'i', 'you', 'your', 'my', 'we', 'they', 'their', 'our', 'he', 'she', 'his', 'her', 'its', 'new', 'more', 'one', 'an',
    '이', '그', '저', '나', '너', '우리', '그들', '그것', '이것', '저것', '는', '은', '이', '가', '을', '를', '에', '의'
  ]);
  
  // 모든 비디오에서 단어 추출 및 빈도 계산
  const wordFreq: Record<string, number> = {};
  
  // 각 텍스트에서 단어 추출
  texts.forEach(text => {
    // 특수문자 제거 후 단어 분리
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u1FFF\u3040-\u9FFF]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));
    
    // 이 비디오의 고유 단어만 고려 (중복 제거)
    const uniqueWords = [...new Set(words)];
    
    // 단어 빈도 계산
    uniqueWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  // 일정 비율(40% 이상)의 비디오에서 등장하는 단어만 추출
  const threshold = Math.ceil(texts.length * 0.4);
  
  return Object.entries(wordFreq)
    .filter(([_, count]) => count >= threshold)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .slice(0, 5)
    .map(([word]) => word);
}

// SEO 점수 계산 함수들 (5점 만점)
// 개선된 버전: Shorts와 Regular 비디오 타입에 따라 다른 기준 적용
function calculateTitleScore(titleLengths: number[], isShorts: boolean = false): number {
  // 유튜브 제목 길이 권장사항 (개선): 
  // - Shorts: 30-50자
  // - Regular: 60-70자
  const avgLength = titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length;
  
  if (isShorts) {
    // Shorts 최적화 점수
    if (avgLength >= 30 && avgLength <= 50) return 5.0;
    if ((avgLength >= 25 && avgLength < 30) || (avgLength > 50 && avgLength <= 55)) return 4.5;
    if ((avgLength >= 20 && avgLength < 25) || (avgLength > 55 && avgLength <= 60)) return 4.0;
    if ((avgLength >= 15 && avgLength < 20) || (avgLength > 60 && avgLength <= 70)) return 3.5;
    if ((avgLength >= 10 && avgLength < 15) || (avgLength > 70 && avgLength <= 80)) return 3.0;
    if (avgLength < 10 || avgLength > 80) return 2.0;
  } else {
    // Regular 비디오 최적화 점수
    if (avgLength >= 60 && avgLength <= 70) return 5.0;
    if (avgLength >= 50 && avgLength < 60) return 4.5;
    if (avgLength > 70 && avgLength <= 80) return 4.0;
    if (avgLength >= 40 && avgLength < 50) return 3.5;
    if (avgLength > 80 && avgLength <= 90) return 3.0;
    if (avgLength >= 30 && avgLength < 40) return 2.5;
    if (avgLength > 90 && avgLength <= 100) return 2.0;
    if (avgLength >= 20 && avgLength < 30) return 1.5;
    if (avgLength > 100) return 1.0;
    return 0.5; // 20자 미만
  }
  
  return 3.0; // 기본값
}

function calculateDescriptionScore(descriptionLengths: number[], isShorts: boolean = false): number {
  // 유튜브 설명 길이 권장사항 (개선):
  // - Regular: 최소 200자 이상
  // - Shorts: 간결한 설명 + 1-2개 관련 해시태그
  const avgLength = descriptionLengths.reduce((a, b) => a + b, 0) / descriptionLengths.length;
  
  if (isShorts) {
    // Shorts 설명 최적화 점수 (간결하면서도 키워드 포함)
    if (avgLength >= 30 && avgLength <= 100) return 5.0;
    if (avgLength > 100 && avgLength <= 150) return 4.5;
    if (avgLength > 150 && avgLength <= 200) return 4.0;
    if (avgLength > 0 && avgLength < 30) return 3.5;
    if (avgLength > 200) return 3.0;
    return 2.0; // 설명 없음
  } else {
    // Regular 비디오 설명 최적화 점수
    if (avgLength >= 200) return 5.0;
    if (avgLength >= 150 && avgLength < 200) return 4.0;
    if (avgLength >= 100 && avgLength < 150) return 3.0;
    if (avgLength >= 50 && avgLength < 100) return 2.0;
    if (avgLength >= 20 && avgLength < 50) return 1.0;
    return 0.5; // 20자 미만
  }
}

function calculateHashtagScore(hashtagCounts: number[], isShorts: boolean = false): number {
  // 해시태그 권장사항 (개선):
  // - Regular 및 Shorts: 3-5개의 관련성 높은 해시태그 + 트렌딩/니치 해시태그 조합
  const avgCount = hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length;
  
  if (isShorts) {
    // Shorts 해시태그 최적화 점수
    if (avgCount >= 3 && avgCount <= 5) return 5.0;
    if (avgCount > 5 && avgCount <= 7) return 4.5;
    if (avgCount == 2) return 4.0;
    if (avgCount == 1) return 3.5;
    if (avgCount > 7 && avgCount <= 10) return 3.0;
    if (avgCount > 10) return 2.5;
    return 2.0; // 해시태그 없음
  } else {
    // Regular 비디오 해시태그 최적화 점수
    if (avgCount >= 3 && avgCount <= 5) return 5.0;
    if (avgCount > 5 && avgCount <= 7) return 4.0;
    if (avgCount > 0 && avgCount < 3) return 3.5;
    if (avgCount > 7 && avgCount <= 10) return 3.0;
    if (avgCount > 10) return 2.0;
    return 1.0; // 해시태그 없음
  }
}

function calculateKeywordConsistencyScore(texts: string[], isShorts: boolean = false): number {
  // 키워드 일관성 점수 (개선): 
  // - 채널 주제에 맞는 주요 키워드 일관성 평가
  // - NLP 기반 상위 5개 키워드 추출 및 일관성 측정
  const stopwords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'with', 'on', 'at', 'from', 'by', 'an', 'or', 'but', 'this', 'that', 'as', 'are', 'be', 'was', 'were', 'have', 'has', 'had', 'it', 'they', 'their', 'them', 'we', 'our', 'us', 'you', 'your', 'he', 'she', 'his', 'her', 'my', 'me', 'mine', 'yours', 'hers', 'its', 'ours', 'theirs']);
  const wordFreq: {[key: string]: number} = {};
  
  // 각 텍스트에서 단어 추출
  texts.forEach(text => {
    // 특수문자 제거 후 단어 분리
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u1FFF\u3040-\u9FFF]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));
    
    // 이 비디오의 고유 단어만 고려 (중복 제거)
    const uniqueWords = Array.from(new Set(words));
    
    // 단어 빈도 계산
    uniqueWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  // 비디오 타입에 따라 다른 임계값 적용
  const threshold = isShorts 
    ? Math.ceil(texts.length * 0.3) // Shorts: 30% 이상의 비디오에서 등장 (주제 분산도 높을 수 있음)
    : Math.ceil(texts.length * 0.4); // Regular: 40% 이상의 비디오에서 등장
  
  const consistentKeywords = Object.values(wordFreq).filter(count => count >= threshold).length;
  
  // 일관성 점수 계산 (Shorts와 Regular 비디오에 동일하게 적용)
  if (consistentKeywords >= 5) return 5.0;
  if (consistentKeywords >= 4) return 4.5;
  if (consistentKeywords >= 3) return 4.0;
  if (consistentKeywords >= 2) return 3.0;
  if (consistentKeywords >= 1) return 2.0;
  return 1.0;
}

function calculateUploadStrategyScore(uploadDates: Date[]): number {
  if (uploadDates.length < 3) return 3.0; // 데이터가 부족한 경우 보통 점수
  
  // 날짜 정렬
  const sortedDates = [...uploadDates].sort((a, b) => a.getTime() - b.getTime());
  
  // 업로드 간격 계산 (일 단위)
  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const diffTime = Math.abs(sortedDates[i].getTime() - sortedDates[i-1].getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    intervals.push(diffDays);
  }
  
  // 간격의 표준편차 계산 (일관성 지표)
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const squaredDiffs = intervals.map(val => Math.pow(val - avgInterval, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  // 평균 업로드 간격(일) 기준 점수
  let baseScore = 0;
  
  // shorts와 regular 구분 없이 업로드 전략 평가
  // - 초단기 간격(매일): 5.0점
  // - 단기 간격(3일 이내): 4.5점
  // - 중기 간격(1주): 4.0점
  // - 장기 간격(2주): 3.5점
  if (avgInterval <= 1) baseScore = 5.0;       // 매일 업로드
  else if (avgInterval <= 3) baseScore = 4.5;  // 3일에 1회 이상
  else if (avgInterval <= 7) baseScore = 4.0;  // 주 1회 이상
  else if (avgInterval <= 10) baseScore = 3.8; // 열흘에 1회 이상
  else if (avgInterval <= 14) baseScore = 3.5; // 2주에 1회 이상
  else if (avgInterval <= 21) baseScore = 3.0; // 3주에 1회 이상
  else if (avgInterval <= 30) baseScore = 2.5; // 월 1회 이상
  else baseScore = 2.0;                        // 월 1회 미만
  
  // 일관성 보너스 포인트 (제안에 따라 개선)
  // 일관된 패턴 보너스: "every 24h ±2h"
  const consistencyModifier = 
    stdDev <= 0.5 ? 1.0 :  // 거의 완벽한 간격 (24h ±30min)
    stdDev <= 1 ? 0.5 :    // 매우 일관됨 (24h ±1h)
    stdDev <= 2 ? 0.3 :    // 일관됨 (24h ±2h)
    stdDev <= 3 ? 0.2 :    // 꽤 일관됨
    stdDev <= 5 ? 0.1 :    // 어느 정도 일관됨
    stdDev <= 10 ? 0 :     // 보통
    stdDev <= 15 ? -0.1 :  // 불규칙함
    -0.2;                  // 매우 불규칙함
  
  // 최종 점수
  const finalScore = Math.min(5, Math.max(1, baseScore + consistencyModifier));
  
  // 소수점 한 자리로 반올림
  return Math.round(finalScore * 10) / 10;
}

// 해시태그 배열에서 공통 해시태그 찾기
function findCommonHashtags(hashtags: string[][]): string[] {
  // 모든 해시태그의 빈도 계산
  const hashtagFreq: Record<string, number> = {};
  
  hashtags.forEach(videoHashtags => {
    // 비디오별로 중복 제거 (같은 비디오에서 동일한 해시태그가 반복될 경우 1번만 계산)
    const uniqueHashtags = [...new Set(videoHashtags)];
    
    uniqueHashtags.forEach(tag => {
      hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1;
    });
  });
  
  // 30% 이상의 비디오에서 사용된 해시태그만 추출
  const threshold = Math.ceil(hashtags.length * 0.3);
  
  return Object.entries(hashtagFreq)
    .filter(([_, count]) => count >= threshold)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .slice(0, 5)
    .map(([tag]) => tag);
}

// 주요 키워드 추출
function findTopKeywords(texts: string[]): string[] {
  // 불용어 (stopwords) 목록
  const stopwords = new Set([
    'the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'this', 'by', 'are', 'was', 'be',
    'i', 'you', 'your', 'my', 'we', 'they', 'their', 'our', 'he', 'she', 'his', 'her', 'its', 'new', 'more', 'one', 'an',
    '이', '그', '저', '나', '너', '우리', '그들', '그것', '이것', '저것', '는', '은', '이', '가', '을', '를', '에', '의'
  ]);
  
  // 모든 텍스트에서 단어 추출 및 빈도 계산
  const wordFreq: Record<string, number> = {};
  
  // 단어 추출 및 빈도 계산
  const allWords = texts.join(' ')
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u1FFF\u3040-\u9FFF]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
  
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // 빈도순 정렬 및 상위 10개 추출
  return Object.entries(wordFreq)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .slice(0, 10)
    .map(([word]) => word);
}

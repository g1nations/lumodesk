import axios from 'axios';

/**
 * OpenRouter API를 통해 AI 응답을 가져오는 함수
 * 
 * @param prompt AI에게 전달할 프롬프트
 * @param apiKey OpenRouter API 키
 * @param model 사용할 모델 (기본값: qwen/qwen3-235b-a22b:free)
 * @param language 응답 언어 (기본값: 'en', 한국어는 'ko')
 * @returns AI 응답 텍스트
 */
export async function getAiResponse(prompt: string, apiKey: string, model: string = 'qwen/qwen3-235b-a22b:free', language: string = 'en') {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful YouTube content analysis assistant. ${language === 'ko' ? 'Respond in Korean language.' : 'Respond in English language.'}` 
          },
          { role: 'user', content: prompt }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mocktube-scanner.replit.app',
          'X-Title': 'MockTube Scanner'
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('No response from AI');
    }
  } catch (error: any) {
    console.error('AI API error:', error.response?.data || error.message);
    throw new Error(`AI request failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * 영상 제목, 설명 등을 기반으로 SEO 분석을 수행
 * 
 * @param title 영상 제목
 * @param description 영상 설명
 * @param tags 태그 목록 (해시태그)
 * @param apiKey OpenRouter API 키
 * @param model 사용할 AI 모델
 * @param language 응답 언어 (en 또는 ko)
 * @returns SEO 분석 결과
 */
export async function analyzeSEO(title: string, description: string, tags: string[], apiKey: string, model?: string, language: string = 'en') {
  const prompt = `
You are a YouTube SEO expert. Analyze this YouTube Shorts content and provide detailed SEO recommendations:

Title: "${title}"
Description: "${description}"
Hashtags: ${tags.join(', ')}

Please provide:
1. An overall SEO score (0-100)
2. Title optimization feedback (current length, ideal length, and improvement suggestions)
   - Don't suggest rewriting the title
   - Provide specific reasons why the current title needs improvement
   - Explain what SEO principles apply here
   - Each feedback point should be actionable advice
3. Description optimization feedback (current length, ideal length, what's missing)
   - Analyze keyword placement and density
   - Highlight elements that could improve engagement
4. Hashtag optimization (current count, ideal count, relevant hashtags to add)
5. Clear presentation with scores shown for each section:
   - Title: X/100
   - Description: X/100
   - Hashtags: X/100
   - Overall: X/100

Format your response with clear sections and bullet points. Be specific and actionable. Do NOT provide rewritten content - only offer advice on how the user could improve it themselves.
`;

  return await getAiResponse(prompt, apiKey, model, language);
}

/**
 * 캡션 내용을 기반으로 패러디 생성
 * 
 * @param caption 영상 자막 텍스트
 * @param apiKey OpenRouter API 키
 * @param model 사용할 모델 (선택적)
 * @param language 응답 언어 (en 또는 ko)
 * @returns 패러디 텍스트
 */
export async function generateParody(caption: string, apiKey: string, model?: string, language: string = 'en') {
  const prompt = `
Create a humorous parody version of this YouTube Shorts script. Make it entertaining and slightly exaggerated while keeping the same basic structure and topic.

Original caption:
"""
${caption}
"""

Requirements:
1. Maintain the same general topic but add humor and exaggeration
2. Keep approximately the same length as the original
3. Make it entertaining but not offensive
4. Add a touch of satire about typical YouTube creator styles

Create a parody that could actually be used as an alternative script for a humorous remake.
`;

  return await getAiResponse(prompt, apiKey, model, language);
}

/**
 * 캡션 최적화 조언 제공
 * 
 * @param caption 영상 자막 텍스트
 * @param apiKey OpenRouter API 키
 * @param model 사용할 모델 (선택적)
 * @param language 응답 언어 (en 또는 ko)
 * @returns 캡션 최적화 조언
 */
export async function analyzeCaptionOptimization(caption: string, apiKey: string, model?: string, language: string = 'en') {
  const prompt = `
You are a YouTube Shorts script optimization expert. Analyze this caption/script for a YouTube Short and provide optimization advice (do NOT rewrite the script):

Caption:
"""
${caption}
"""

Provide advice in these categories (score each 0-100):

1. Hook (First few seconds):
   - Is it attention-grabbing?
   - Does it create curiosity/interest?
   - How quickly does it engage?

2. Structure:
   - Emotional journey (start → tension → resolution)
   - Logical flow between sections
   - Pacing and timing

3. Language Style:
   - Conversational vs formal
   - Sentence length and variety
   - Use of power words/phrases

4. Voice & Perspective:
   - 1st/2nd person usage
   - Direct addressing of viewer
   - Authority/relatability balance

5. Emotional Impact:
   - Emotional triggers used
   - Storytelling elements
   - Memorable phrases/moments

6. Core Message:
   - Clarity of main point
   - Call to action strength
   - Memorable takeaway

Format with clear sections, bullet points, and specific actionable advice. Do NOT rewrite the script - only provide advice on how the user could improve it themselves. Focus on short-form content best practices.
`;

  return await getAiResponse(prompt, apiKey, model, language);
}
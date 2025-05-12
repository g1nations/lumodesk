import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// YouTube API data schema types

export interface ChannelAnalysisResult {
  type: 'channel' | 'channel_shorts' | 'shorts';
  channelInfo: {
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl: string;
      publishedAt: string;
      thumbnails: {
        default?: { url: string; width: number; height: number };
        medium?: { url: string; width: number; height: number };
        high?: { url: string; width: number; height: number };
      };
    };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      videoCount: string;
    };
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  };
  videos: Array<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    viewCount: string;
    likeCount: string;
    commentCount: string;
    duration: number;
    isShort: boolean;
    hashtags: string[];
  }>;
  uploadFrequency: string;
  popularHashtags: string[];
  shortsFrequency?: string;
}

export interface ShortsAnalysisResult {
  type: 'shorts';
  videoInfo: {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    duration: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    hashtags: string[];
    captionsAvailable: boolean;
    transcriptNote: string;
  };
}

export type AnalysisResult = ChannelAnalysisResult | ShortsAnalysisResult;

// Default database schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

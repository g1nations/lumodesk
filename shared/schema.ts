import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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

// Database Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analysisHistory = pgTable("analysis_history", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  youtubeId: text("youtube_id").notNull(),
  type: text("type").notNull(), // 'channel', 'channel_shorts', or 'shorts'
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  viewCount: text("view_count"),
  resultData: jsonb("result_data").notNull(), // Store the full analysis result as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  apiKey: text("api_key").notNull(),
});

// Relations setup
export const relations = {
  // Add relations here if needed
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAnalysisHistory = z.infer<typeof insertAnalysisHistorySchema>;
export type AnalysisHistory = typeof analysisHistory.$inferSelect;

import { 
  users, 
  analysisHistory, 
  type User, 
  type InsertUser, 
  type AnalysisHistory,
  type InsertAnalysisHistory,
  type AnalysisResult
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis history methods
  saveAnalysis(analysis: InsertAnalysisHistory): Promise<AnalysisHistory>;
  getAnalysisById(id: number): Promise<AnalysisHistory | undefined>;
  getRecentAnalyses(limit?: number): Promise<AnalysisHistory[]>;
  getAnalysisByYoutubeId(youtubeId: string): Promise<AnalysisHistory | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Analysis history methods
  async saveAnalysis(analysis: InsertAnalysisHistory): Promise<AnalysisHistory> {
    const [savedAnalysis] = await db
      .insert(analysisHistory)
      .values(analysis)
      .returning();
    return savedAnalysis;
  }
  
  async getAnalysisById(id: number): Promise<AnalysisHistory | undefined> {
    const [analysis] = await db
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.id, id));
    return analysis || undefined;
  }
  
  async getRecentAnalyses(limit: number = 10): Promise<AnalysisHistory[]> {
    return await db
      .select()
      .from(analysisHistory)
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);
  }
  
  async getAnalysisByYoutubeId(youtubeId: string): Promise<AnalysisHistory | undefined> {
    const [analysis] = await db
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.youtubeId, youtubeId))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(1);
    return analysis || undefined;
  }
}

export const storage = new DatabaseStorage();
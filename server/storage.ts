import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";
import {
  users,
  properties,
  inquiries,
  favorites,
  otpTokens,
  type User,
  type InsertUser,
  type Property,
  type InsertProperty,
  type Inquiry,
  type InsertInquiry,
  type Favorite,
  type InsertFavorite,
  type PropertyWithOwner,
  type InquiryWithDetails,
  type OtpToken,
  type InsertOtpToken,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, isActive: boolean): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // OTP Tokens
  createOtpToken(token: InsertOtpToken): Promise<OtpToken>;
  getValidOtpToken(email: string, otp: string): Promise<OtpToken | undefined>;
  consumeOtpToken(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getPropertyWithOwner(id: string): Promise<PropertyWithOwner | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesByOwner(ownerId: string): Promise<Property[]>;
  getPendingProperties(): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  incrementPropertyViews(id: string): Promise<void>;

  // Inquiries
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiriesBySeller(sellerId: string): Promise<InquiryWithDetails[]>;
  getInquiriesByBuyer(buyerId: string): Promise<InquiryWithDetails[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  markInquiryAsRead(id: string): Promise<Inquiry | undefined>;

  // Favorites
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, propertyId: string): Promise<boolean>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;

  // Stats
  getAdminStats(): Promise<{
    totalProperties: number;
    pendingApprovals: number;
    totalUsers: number;
    activeListings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
      id: randomUUID(),
      isActive: true,
      createdAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Check if user is super admin
    const user = await this.getUser(id);
    if (user?.isSuperAdmin) {
      return false; // Cannot delete super admin
    }
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // OTP Tokens
  async createOtpToken(insertToken: InsertOtpToken): Promise<OtpToken> {
    // First, delete any existing tokens for this email
    await db.delete(otpTokens).where(eq(otpTokens.email, insertToken.email.toLowerCase()));
    
    const [token] = await db.insert(otpTokens).values({
      ...insertToken,
      email: insertToken.email.toLowerCase(),
      id: randomUUID(),
      createdAt: new Date(),
    }).returning();
    return token;
  }

  async getValidOtpToken(email: string, otp: string): Promise<OtpToken | undefined> {
    const [token] = await db.select().from(otpTokens)
      .where(and(
        eq(otpTokens.email, email.toLowerCase()),
        eq(otpTokens.otp, otp),
        eq(otpTokens.consumed, false)
      ));
    
    if (!token) return undefined;
    if (token.expiresAt < new Date()) return undefined;
    if (token.attempts >= 5) return undefined;
    
    return token;
  }

  async consumeOtpToken(id: string): Promise<void> {
    await db.update(otpTokens)
      .set({ consumed: true })
      .where(eq(otpTokens.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    const token = await db.select().from(otpTokens).where(eq(otpTokens.id, id));
    if (token.length > 0) {
      await db.update(otpTokens)
        .set({ attempts: token[0].attempts + 1 })
        .where(eq(otpTokens.id, id));
    }
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db.delete(otpTokens).where(lt(otpTokens.expiresAt, new Date()));
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertyWithOwner(id: string): Promise<PropertyWithOwner | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    if (!property) return undefined;

    const owner = await this.getUser(property.ownerId);
    if (!owner) return undefined;

    return {
      ...property,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        avatar: owner.avatar,
        role: owner.role,
      },
    };
  }

  async getAllProperties(): Promise<Property[]> {
    return db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return db.select().from(properties)
      .where(eq(properties.ownerId, ownerId))
      .orderBy(desc(properties.createdAt));
  }

  async getPendingProperties(): Promise<Property[]> {
    return db.select().from(properties)
      .where(eq(properties.status, "pending"))
      .orderBy(desc(properties.createdAt));
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return db.select().from(properties)
      .where(and(eq(properties.isFeatured, true), eq(properties.status, "approved")))
      .orderBy(desc(properties.views));
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values({
      ...insertProperty,
      id: randomUUID(),
      views: 0,
      createdAt: new Date(),
    }).returning();
    return property;
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined> {
    const [property] = await db.update(properties)
      .set(updates)
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }

  async incrementPropertyViews(id: string): Promise<void> {
    const property = await this.getProperty(id);
    if (property) {
      await db.update(properties)
        .set({ views: property.views + 1 })
        .where(eq(properties.id, id));
    }
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async getInquiriesBySeller(sellerId: string): Promise<InquiryWithDetails[]> {
    const result = await db.select().from(inquiries)
      .where(eq(inquiries.sellerId, sellerId))
      .orderBy(desc(inquiries.createdAt));
    return this.enrichInquiries(result);
  }

  async getInquiriesByBuyer(buyerId: string): Promise<InquiryWithDetails[]> {
    const result = await db.select().from(inquiries)
      .where(eq(inquiries.buyerId, buyerId))
      .orderBy(desc(inquiries.createdAt));
    return this.enrichInquiries(result);
  }

  private async enrichInquiries(inquiriesData: Inquiry[]): Promise<InquiryWithDetails[]> {
    return Promise.all(
      inquiriesData.map(async (inquiry) => {
        const property = await this.getProperty(inquiry.propertyId);
        const buyer = await this.getUser(inquiry.buyerId);
        return {
          ...inquiry,
          property: property
            ? {
                id: property.id,
                title: property.title,
                address: property.address,
                city: property.city,
                images: property.images,
              }
            : { id: "", title: "Unknown", address: "", city: "", images: [] },
          buyer: buyer
            ? {
                id: buyer.id,
                fullName: buyer.fullName,
                email: buyer.email,
                phone: buyer.phone,
                avatar: buyer.avatar,
              }
            : { id: "", fullName: "Unknown", email: "", phone: null, avatar: null },
        };
      })
    );
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values({
      ...insertInquiry,
      id: randomUUID(),
      isRead: false,
      createdAt: new Date(),
    }).returning();
    return inquiry;
  }

  async markInquiryAsRead(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.update(inquiries)
      .set({ isRead: true })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry;
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values({
      ...insertFavorite,
      id: randomUUID(),
      createdAt: new Date(),
    }).returning();
    return favorite;
  }

  async removeFavorite(userId: string, propertyId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)))
      .returning();
    return result.length > 0;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const [favorite] = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }

  // Stats
  async getAdminStats(): Promise<{
    totalProperties: number;
    pendingApprovals: number;
    totalUsers: number;
    activeListings: number;
  }> {
    const allProperties = await db.select().from(properties);
    const allUsers = await db.select().from(users);
    
    return {
      totalProperties: allProperties.length,
      pendingApprovals: allProperties.filter((p) => p.status === "pending").length,
      totalUsers: allUsers.length,
      activeListings: allProperties.filter((p) => p.status === "approved").length,
    };
  }
}

export const storage = new DatabaseStorage();

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const UserRole = {
  BUYER: "buyer",
  SELLER: "seller",
  AGENT: "agent",
  ADMIN: "admin",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Property listing types
export const ListingType = {
  SALE: "sale",
  LEASE: "lease",
} as const;

export type ListingTypeValue = typeof ListingType[keyof typeof ListingType];

// Property types
export const PropertyType = {
  HOUSE: "house",
  APARTMENT: "apartment",
  CONDO: "condo",
  TOWNHOUSE: "townhouse",
  VILLA: "villa",
  LAND: "land",
  COMMERCIAL: "commercial",
} as const;

export type PropertyTypeValue = typeof PropertyType[keyof typeof PropertyType];

// Listing status
export const ListingStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SOLD: "sold",
  LEASED: "leased",
} as const;

export type ListingStatusValue = typeof ListingStatus[keyof typeof ListingStatus];

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("buyer"),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  listingType: text("listing_type").notNull(), // sale or lease
  propertyType: text("property_type").notNull(), // house, apartment, etc.
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  squareFeet: integer("square_feet").notNull(),
  yearBuilt: integer("year_built"),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  status: text("status").notNull().default("pending"),
  ownerId: varchar("owner_id").notNull(), // seller or agent who created
  ownerType: text("owner_type").notNull(), // 'seller' or 'agent'
  views: integer("views").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  views: true,
  createdAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Inquiries table
export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  sellerId: varchar("seller_id").notNull(), // property owner
  message: text("message").notNull(),
  phone: text("phone"),
  email: text("email").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Extended types for API responses
export type PropertyWithOwner = Property & {
  owner: Pick<User, "id" | "fullName" | "email" | "phone" | "avatar" | "role">;
};

export type InquiryWithDetails = Inquiry & {
  property: Pick<Property, "id" | "title" | "address" | "city" | "images">;
  buyer: Pick<User, "id" | "fullName" | "email" | "phone" | "avatar">;
};

// Form validation schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["buyer", "seller", "agent"]),
});

export const propertyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  listingType: z.enum(["sale", "lease"]),
  propertyType: z.enum(["house", "apartment", "condo", "townhouse", "villa", "land", "commercial"]),
  price: z.string().min(1, "Price is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  squareFeet: z.string().min(1, "Square feet is required"),
  yearBuilt: z.string().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
});

export const inquiryFormSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;
export type InquiryFormData = z.infer<typeof inquiryFormSchema>;

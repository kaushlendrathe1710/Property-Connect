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

// Verification status
export const VerificationStatus = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export type VerificationStatusValue = typeof VerificationStatus[keyof typeof VerificationStatus];

// Document types for sale
export const SaleDocumentTypes = {
  SALE_DEED: "sale_deed",
  TITLE_DEED: "title_deed",
  ENCUMBRANCE_CERTIFICATE: "encumbrance_certificate",
  PROPERTY_TAX_RECEIPT: "property_tax_receipt",
  MUTATION_CERTIFICATE: "mutation_certificate",
  NOC: "noc",
  OWNER_ID_PROOF: "owner_id_proof",
  ALLOTMENT_LETTER: "allotment_letter",
  POSSESSION_LETTER: "possession_letter",
  OCCUPANCY_CERTIFICATE: "occupancy_certificate",
  COMPLETION_CERTIFICATE: "completion_certificate",
  SOCIETY_SHARE_CERTIFICATE: "society_share_certificate",
  SURVEY_PLAN: "survey_plan",
  CONVERSION_CERTIFICATE: "conversion_certificate",
  PATTA_KHATA: "patta_khata",
} as const;

// Document types for lease
export const LeaseDocumentTypes = {
  OWNERSHIP_PROOF: "ownership_proof",
  PROPERTY_TAX_RECEIPT: "property_tax_receipt",
  OWNER_ID_PROOF: "owner_id_proof",
  NOC_SOCIETY: "noc_society",
} as const;

// Users table - Updated for OTP auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").notNull().default("buyer"),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// OTP Tokens table
export const otpTokens = pgTable("otp_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpTokenSchema = createInsertSchema(otpTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertOtpToken = z.infer<typeof insertOtpTokenSchema>;
export type OtpToken = typeof otpTokens.$inferSelect;

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  listingType: text("listing_type").notNull(),
  propertyType: text("property_type").notNull(),
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
  ownerId: varchar("owner_id").notNull(),
  ownerType: text("owner_type").notNull(),
  views: integer("views").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Documents table
export const propertyDocuments = pgTable("property_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertPropertyDocumentSchema = createInsertSchema(propertyDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertPropertyDocument = z.infer<typeof insertPropertyDocumentSchema>;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;

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
  sellerId: varchar("seller_id").notNull(),
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

// Form validation schemas for OTP auth
export const requestOtpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
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

export const createAdminSchema = z.object({
  requesterId: z.string().min(1, "Requester ID is required"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export type RequestOtpData = z.infer<typeof requestOtpSchema>;
export type VerifyOtpData = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileData = z.infer<typeof completeProfileSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;
export type InquiryFormData = z.infer<typeof inquiryFormSchema>;
export type CreateAdminData = z.infer<typeof createAdminSchema>;

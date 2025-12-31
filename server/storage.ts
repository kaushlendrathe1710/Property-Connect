import {
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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, isActive: boolean): Promise<User | undefined>;

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private properties: Map<string, Property>;
  private inquiries: Map<string, Inquiry>;
  private favorites: Map<string, Favorite>;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.inquiries = new Map();
    this.favorites = new Map();
    this.seedData();
  }

  private seedData() {
    // Create admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123",
      email: "admin@propmarket.com",
      fullName: "Admin User",
      phone: "+1 (555) 000-0001",
      role: "admin",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    });

    // Create sample agent
    const agentId = randomUUID();
    this.users.set(agentId, {
      id: agentId,
      username: "agent1",
      password: "agent123",
      email: "agent@propmarket.com",
      fullName: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      role: "agent",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    });

    // Create sample seller
    const sellerId = randomUUID();
    this.users.set(sellerId, {
      id: sellerId,
      username: "seller1",
      password: "seller123",
      email: "seller@propmarket.com",
      fullName: "Michael Chen",
      phone: "+1 (555) 234-5678",
      role: "seller",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    });

    // Create sample buyer
    const buyerId = randomUUID();
    this.users.set(buyerId, {
      id: buyerId,
      username: "buyer1",
      password: "buyer123",
      email: "buyer@propmarket.com",
      fullName: "Emily Davis",
      phone: "+1 (555) 345-6789",
      role: "buyer",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    });

    // Sample properties
    const sampleProperties = [
      {
        title: "Modern Downtown Apartment",
        description: "Stunning 2-bedroom apartment in the heart of downtown. Features floor-to-ceiling windows with panoramic city views, modern kitchen with stainless steel appliances, and in-unit laundry. Building amenities include 24/7 concierge, rooftop pool, and fitness center. Walking distance to restaurants, shopping, and public transit.",
        listingType: "sale" as const,
        propertyType: "apartment" as const,
        price: "485000",
        address: "1250 Market Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94103",
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        yearBuilt: 2019,
        images: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Air Conditioning", "Gym", "Pool", "Parking", "Security System", "Elevator"],
        status: "approved",
        ownerId: agentId,
        ownerType: "agent",
        views: 127,
        isFeatured: true,
      },
      {
        title: "Charming Victorian Home",
        description: "Beautiful Victorian home with original architectural details preserved. Features 4 spacious bedrooms, a gourmet kitchen with granite countertops, hardwood floors throughout, and a private backyard with mature landscaping. Located in a quiet, family-friendly neighborhood with excellent schools nearby.",
        listingType: "sale" as const,
        propertyType: "house" as const,
        price: "875000",
        address: "456 Oak Avenue",
        city: "Oakland",
        state: "CA",
        zipCode: "94610",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2400,
        yearBuilt: 1905,
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Garden", "Fireplace", "Laundry", "Parking"],
        status: "approved",
        ownerId: sellerId,
        ownerType: "seller",
        views: 89,
        isFeatured: true,
      },
      {
        title: "Luxury Waterfront Condo",
        description: "Exclusive waterfront condo with breathtaking bay views. This stunning 3-bedroom unit features an open floor plan, chef's kitchen, spa-like master bath, and private balcony. Resort-style amenities include infinity pool, spa, tennis courts, and marina access.",
        listingType: "sale" as const,
        propertyType: "condo" as const,
        price: "1250000",
        address: "789 Marina Boulevard",
        city: "Sausalito",
        state: "CA",
        zipCode: "94965",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1850,
        yearBuilt: 2021,
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Air Conditioning", "Pool", "Gym", "Balcony", "Security System"],
        status: "approved",
        ownerId: agentId,
        ownerType: "agent",
        views: 203,
        isFeatured: true,
      },
      {
        title: "Cozy Studio Near Campus",
        description: "Perfect studio apartment for students or young professionals. Recently renovated with modern finishes, full kitchen, and ample closet space. Utilities included in rent. Just steps from UC Berkeley campus and public transit.",
        listingType: "lease" as const,
        propertyType: "apartment" as const,
        price: "2200",
        address: "2100 Durant Avenue",
        city: "Berkeley",
        state: "CA",
        zipCode: "94704",
        bedrooms: 0,
        bathrooms: 1,
        squareFeet: 450,
        yearBuilt: 1970,
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Air Conditioning", "Laundry"],
        status: "approved",
        ownerId: sellerId,
        ownerType: "seller",
        views: 56,
        isFeatured: false,
      },
      {
        title: "Spacious Family Townhouse",
        description: "Beautifully maintained townhouse perfect for families. Features 3 bedrooms, 2.5 baths, attached 2-car garage, and private patio. Open-concept living area with fireplace. Located in a gated community with playground and pool access.",
        listingType: "sale" as const,
        propertyType: "townhouse" as const,
        price: "650000",
        address: "321 Cypress Lane",
        city: "San Jose",
        state: "CA",
        zipCode: "95126",
        bedrooms: 3,
        bathrooms: 3,
        squareFeet: 1650,
        yearBuilt: 2015,
        images: [
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Parking", "Pool", "Garden", "Fireplace", "Security System"],
        status: "approved",
        ownerId: agentId,
        ownerType: "agent",
        views: 78,
        isFeatured: false,
      },
      {
        title: "Commercial Office Space",
        description: "Prime commercial office space in downtown business district. Features open floor plan suitable for various business types, conference room, private offices, and reception area. Building offers 24/7 access, on-site parking, and professional management.",
        listingType: "lease" as const,
        propertyType: "commercial" as const,
        price: "5500",
        address: "500 Financial Center",
        city: "San Francisco",
        state: "CA",
        zipCode: "94111",
        bedrooms: 0,
        bathrooms: 2,
        squareFeet: 2500,
        yearBuilt: 2010,
        images: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60",
        ],
        amenities: ["Air Conditioning", "Parking", "Elevator", "Security System"],
        status: "pending",
        ownerId: sellerId,
        ownerType: "seller",
        views: 12,
        isFeatured: false,
      },
    ];

    sampleProperties.forEach((prop) => {
      const id = randomUUID();
      this.properties.set(id, {
        id,
        ...prop,
        createdAt: new Date(),
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.isActive = isActive;
      this.users.set(id, user);
    }
    return user;
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertyWithOwner(id: string): Promise<PropertyWithOwner | undefined> {
    const property = this.properties.get(id);
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
    return Array.from(this.properties.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter((p) => p.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getPendingProperties(): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter((p) => p.status === "pending")
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter((p) => p.isFeatured && p.status === "approved")
      .sort((a, b) => b.views - a.views);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = {
      ...insertProperty,
      id,
      views: 0,
      createdAt: new Date(),
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (property) {
      const updated = { ...property, ...updates };
      this.properties.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  async incrementPropertyViews(id: string): Promise<void> {
    const property = this.properties.get(id);
    if (property) {
      property.views += 1;
      this.properties.set(id, property);
    }
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async getInquiriesBySeller(sellerId: string): Promise<InquiryWithDetails[]> {
    const inquiries = Array.from(this.inquiries.values()).filter(
      (i) => i.sellerId === sellerId
    );
    return this.enrichInquiries(inquiries);
  }

  async getInquiriesByBuyer(buyerId: string): Promise<InquiryWithDetails[]> {
    const inquiries = Array.from(this.inquiries.values()).filter(
      (i) => i.buyerId === buyerId
    );
    return this.enrichInquiries(inquiries);
  }

  private async enrichInquiries(inquiries: Inquiry[]): Promise<InquiryWithDetails[]> {
    return Promise.all(
      inquiries.map(async (inquiry) => {
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
    const id = randomUUID();
    const inquiry: Inquiry = {
      ...insertInquiry,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async markInquiryAsRead(id: string): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (inquiry) {
      inquiry.isRead = true;
      this.inquiries.set(id, inquiry);
    }
    return inquiry;
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter((f) => f.userId === userId);
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      ...insertFavorite,
      id,
      createdAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(userId: string, propertyId: string): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      (f) => f.userId === userId && f.propertyId === propertyId
    );
    if (favorite) {
      return this.favorites.delete(favorite.id);
    }
    return false;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      (f) => f.userId === userId && f.propertyId === propertyId
    );
  }

  // Stats
  async getAdminStats(): Promise<{
    totalProperties: number;
    pendingApprovals: number;
    totalUsers: number;
    activeListings: number;
  }> {
    const properties = Array.from(this.properties.values());
    return {
      totalProperties: properties.length,
      pendingApprovals: properties.filter((p) => p.status === "pending").length,
      totalUsers: this.users.size,
      activeListings: properties.filter((p) => p.status === "approved").length,
    };
  }
}

export const storage = new MemStorage();

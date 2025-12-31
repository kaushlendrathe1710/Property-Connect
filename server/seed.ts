import { db } from "./db";
import { users, properties } from "@shared/schema";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding database...");

  // Check if super admin exists
  const existingUsers = await db.select().from(users);
  const superAdminExists = existingUsers.some(u => u.email === "kaushlendra.k12@fms.edu");
  
  if (superAdminExists) {
    console.log("Super admin already exists, checking for sample data...");
  } else {
    // Create super admin
    const superAdminId = randomUUID();
    await db.insert(users).values({
      id: superAdminId,
      email: "kaushlendra.k12@fms.edu",
      fullName: "Super Admin",
      phone: "+91 9999999999",
      role: "admin",
      avatar: null,
      isActive: true,
      isSuperAdmin: true,
      onboardingComplete: true,
      createdAt: new Date(),
    });
    console.log("Super admin created: kaushlendra.k12@fms.edu");
  }

  // Check if we need sample properties
  const existingProperties = await db.select().from(properties);
  if (existingProperties.length > 0) {
    console.log("Sample properties already exist, skipping...");
    return;
  }

  // Create a sample agent for properties
  const agentId = randomUUID();
  await db.insert(users).values({
    id: agentId,
    email: "agent@propmarket.com",
    fullName: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    role: "agent",
    avatar: null,
    isActive: true,
    isSuperAdmin: false,
    onboardingComplete: true,
    createdAt: new Date(),
  });

  // Create a sample seller
  const sellerId = randomUUID();
  await db.insert(users).values({
    id: sellerId,
    email: "seller@propmarket.com",
    fullName: "Michael Chen",
    phone: "+1 (555) 234-5678",
    role: "seller",
    avatar: null,
    isActive: true,
    isSuperAdmin: false,
    onboardingComplete: true,
    createdAt: new Date(),
  });

  // Sample properties
  const sampleProperties = [
    {
      id: randomUUID(),
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
      status: "approved" as const,
      ownerId: agentId,
      ownerType: "agent" as const,
      views: 127,
      isFeatured: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
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
      status: "approved" as const,
      ownerId: sellerId,
      ownerType: "seller" as const,
      views: 89,
      isFeatured: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
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
      status: "approved" as const,
      ownerId: agentId,
      ownerType: "agent" as const,
      views: 203,
      isFeatured: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
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
      status: "approved" as const,
      ownerId: sellerId,
      ownerType: "seller" as const,
      views: 56,
      isFeatured: false,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
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
      status: "approved" as const,
      ownerId: agentId,
      ownerType: "agent" as const,
      views: 78,
      isFeatured: false,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
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
      status: "pending" as const,
      ownerId: sellerId,
      ownerType: "seller" as const,
      views: 12,
      isFeatured: false,
      createdAt: new Date(),
    },
  ];

  for (const prop of sampleProperties) {
    await db.insert(properties).values(prop);
  }

  console.log("Database seeded successfully!");
  console.log("Created super admin and sample data.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

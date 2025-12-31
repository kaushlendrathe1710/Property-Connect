import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requestOtpSchema, verifyOtpSchema, completeProfileSchema, insertPropertySchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";
import { sendOtpEmail, generateOtp } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // OTP Auth routes
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const data = requestOtpSchema.parse(req.body);
      const email = data.email.toLowerCase();
      
      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      // Store OTP
      await storage.createOtpToken({
        email,
        otp,
        expiresAt,
        attempts: 0,
        consumed: false,
      });
      
      // Send email
      const sent = await sendOtpEmail(email, otp);
      if (!sent) {
        return res.status(500).json({ message: "Failed to send OTP email" });
      }
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const email = data.email.toLowerCase();
      
      // Validate OTP
      const token = await storage.getValidOtpToken(email, data.otp);
      if (!token) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      
      // Consume the token
      await storage.consumeOtpToken(token.id);
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      let isNewUser = false;
      
      if (!user) {
        // Create new user with just email
        user = await storage.createUser({
          email,
          fullName: null,
          phone: null,
          role: "buyer",
          avatar: null,
          isActive: true,
          isSuperAdmin: false,
          onboardingComplete: false,
        });
        isNewUser = true;
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account suspended" });
      }
      
      res.json({
        user,
        isNewUser: !user.onboardingComplete,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("OTP verify error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const { userId, ...profileData } = req.body;
      const data = completeProfileSchema.parse(profileData);
      
      const user = await storage.updateUser(userId, {
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        onboardingComplete: true,
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Profile complete error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Properties routes
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/properties/featured", async (req, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyWithOwner(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      await storage.incrementPropertyViews(req.params.id);
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const property = await storage.createProperty(req.body);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, req.body);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // My listings (for sellers/agents)
  app.get("/api/my-listings", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.json([]);
      }
      const properties = await storage.getPropertiesByOwner(userId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.json([]);
      }
      const favorites = await storage.getFavoritesByUser(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const { userId, propertyId } = req.body;
      const favorite = await storage.addFavorite({ userId, propertyId });
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/favorites/:propertyId", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      await storage.removeFavorite(userId, req.params.propertyId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Inquiries routes
  app.get("/api/inquiries", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.json([]);
      }
      const inquiries = await storage.getInquiriesBySeller(userId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/my-inquiries", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.json([]);
      }
      const inquiries = await storage.getInquiriesByBuyer(userId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiry = await storage.createInquiry(req.body);
      res.status(201).json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/inquiries/:id/read", async (req, res) => {
    try {
      const inquiry = await storage.markInquiryAsRead(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/pending-listings", async (req, res) => {
    try {
      const properties = await storage.getPendingProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/recent-users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.slice(0, 10);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/properties/:id/approve", async (req, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, { status: "approved" });
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/properties/:id/reject", async (req, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, { status: "rejected" });
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/users/:id/status", async (req, res) => {
    try {
      const { isActive } = req.body;
      const user = await storage.updateUserStatus(req.params.id, isActive);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete this user" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create admin (super admin only)
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      const { requesterId, email, fullName, phone } = req.body;
      
      // Verify requester is super admin
      const requester = await storage.getUser(requesterId);
      if (!requester || !requester.isSuperAdmin) {
        return res.status(403).json({ message: "Only super admin can create admin accounts" });
      }
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create admin user
      const newAdmin = await storage.createUser({
        email: email.toLowerCase(),
        fullName,
        phone,
        role: "admin",
        avatar: null,
        isActive: true,
        isSuperAdmin: false,
        onboardingComplete: true,
      });
      
      res.status(201).json(newAdmin);
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}

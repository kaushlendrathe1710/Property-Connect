import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPropertySchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account suspended" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        ...data,
        avatar: null,
        isActive: true,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
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
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/recent-users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords and return only recent 10
      const safeUsers = users.slice(0, 10).map(({ password, ...user }) => user);
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
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}

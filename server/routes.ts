import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requestOtpSchema, verifyOtpSchema, completeProfileSchema, insertPropertySchema, insertInquirySchema, createAdminSchema } from "@shared/schema";
import { z } from "zod";
import { sendOtpEmail, generateOtp } from "./email";
import multer from "multer";
import { uploadToS3, deleteFromS3, isS3Configured } from "./s3-service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and images are allowed."));
    }
  },
});

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
        // Check if this is the super admin email
        const isSuperAdminEmail = email === "kaushlendra.k12@fms.edu";
        
        // Create new user with just email
        user = await storage.createUser({
          email,
          fullName: isSuperAdminEmail ? "Super Admin" : null,
          phone: null,
          role: isSuperAdminEmail ? "admin" : "buyer",
          avatar: null,
          isActive: true,
          isSuperAdmin: isSuperAdminEmail,
          onboardingComplete: isSuperAdminEmail, // Super admin skips onboarding
        });
        isNewUser = !isSuperAdminEmail; // Super admin is not a "new user"
      } else if (email === "kaushlendra.k12@fms.edu" && !user.onboardingComplete) {
        // Fix super admin if they exist but onboarding not complete
        const updatedUser = await storage.updateUser(user.id, {
          role: "admin",
          isSuperAdmin: true,
          onboardingComplete: true,
          fullName: user.fullName || "Super Admin",
        });
        if (updatedUser) {
          user = updatedUser;
        }
      }
      
      if (!user || !user.isActive) {
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

  // Profile update endpoint
  app.patch("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = req.params.id;
      const { fullName, phone, requesterId } = req.body;
      
      // Authorization check: user can only update their own profile
      if (!requesterId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get requester to check if they're authorized
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(401).json({ message: "Invalid authentication" });
      }
      
      // Only allow users to update their own profile, or admins to update any profile
      if (requesterId !== userId && requester.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      if (!fullName || fullName.length < 2) {
        return res.status(400).json({ message: "Full name must be at least 2 characters" });
      }
      
      if (!phone || phone.length < 10) {
        return res.status(400).json({ message: "Please enter a valid phone number" });
      }
      
      const user = await storage.updateUser(userId, {
        fullName,
        phone,
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Profile update error:", error);
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

  app.get("/api/admin/all-inquiries", async (req, res) => {
    try {
      const allInquiries = await storage.getAllInquiries();
      res.json(allInquiries);
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
      // Validate request body with Zod schema
      const validatedData = createAdminSchema.parse(req.body);
      const { requesterId, email, fullName, phone } = validatedData;
      
      // Verify requester exists and is super admin
      const requester = await storage.getUser(requesterId);
      if (!requester) {
        return res.status(403).json({ message: "Invalid requester" });
      }
      if (!requester.isSuperAdmin) {
        return res.status(403).json({ message: "Only super admin can create admin accounts" });
      }
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create admin user with full profile (onboardingComplete=true so they can login immediately)
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Document upload routes
  app.post("/api/properties/:id/documents", upload.single("document"), async (req, res) => {
    try {
      if (!isS3Configured()) {
        return res.status(503).json({ message: "File storage is not configured" });
      }

      const propertyId = req.params.id;
      const { documentType, userId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!documentType) {
        return res.status(400).json({ message: "Document type is required" });
      }

      // Verify property exists and user owns it
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.ownerId !== userId) {
        const user = await storage.getUser(userId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "You can only upload documents for your own properties" });
        }
      }

      // Upload to S3
      const { url } = await uploadToS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        `properties/${propertyId}`
      );

      // Save document record
      const document = await storage.addPropertyDocument({
        propertyId,
        documentType,
        fileName: file.originalname,
        fileUrl: url,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Update property verification status to pending if documents are uploaded
      if (property.verificationStatus === "unverified") {
        await storage.updateProperty(propertyId, { verificationStatus: "pending" });
      }

      res.status(201).json(document);
    } catch (error: any) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: error.message || "Failed to upload document" });
    }
  });

  app.get("/api/properties/:id/documents", async (req, res) => {
    try {
      const propertyId = req.params.id;
      const documents = await storage.getPropertyDocuments(propertyId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Get the document to find the file URL
      const documents = await storage.getPropertyDocuments(req.params.id);
      const document = documents.find(d => d.id === req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify ownership or admin
      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.ownerId !== userId) {
        const user = await storage.getUser(userId);
        if (!user || user.role !== "admin") {
          return res.status(403).json({ message: "Not authorized to delete this document" });
        }
      }

      // Delete from storage
      await storage.deletePropertyDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Verification routes
  app.get("/api/admin/pending-verifications", async (req, res) => {
    try {
      const properties = await storage.getPendingVerificationProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/properties/:id/verify", async (req, res) => {
    try {
      const { adminId, status, notes } = req.body;

      if (!adminId) {
        return res.status(401).json({ message: "Admin ID is required" });
      }

      // Verify admin
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Only admins can verify properties" });
      }

      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const property = await storage.verifyProperty(req.params.id, adminId, status, notes);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Request verification for a property
  app.post("/api/properties/:id/request-verification", async (req, res) => {
    try {
      const { userId } = req.body;
      const propertyId = req.params.id;

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "You can only request verification for your own properties" });
      }

      // Check if at least one document is uploaded
      const documents = await storage.getPropertyDocuments(propertyId);
      if (documents.length === 0) {
        return res.status(400).json({ message: "Please upload at least one document before requesting verification" });
      }

      const updated = await storage.updateProperty(propertyId, { verificationStatus: "pending" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // S3 configuration check endpoint
  app.get("/api/config/s3-status", (req, res) => {
    res.json({ configured: isS3Configured() });
  });

  return httpServer;
}

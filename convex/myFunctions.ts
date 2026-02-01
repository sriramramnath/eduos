import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const deleteAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    // Delete all auth sessions
    const authSessions = await ctx.db.query("authSessions").collect();
    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }
    
    // Delete all auth accounts
    const authAccounts = await ctx.db.query("authAccounts").collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }
    
    // Delete all auth refresh tokens
    const authRefreshTokens = await ctx.db.query("authRefreshTokens").collect();
    for (const token of authRefreshTokens) {
      await ctx.db.delete(token._id);
    }
    
    console.log(`Deleted ${users.length} users, ${authSessions.length} sessions, ${authAccounts.length} accounts, ${authRefreshTokens.length} refresh tokens`);
    return { 
      deletedUsers: users.length,
      deletedSessions: authSessions.length,
      deletedAccounts: authAccounts.length,
      deletedTokens: authRefreshTokens.length
    };
  },
});

export const getAuthenticatedUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Extract user ID from the token identifier
    const userId = identity.subject.split('|')[0] as Id<"users">;
    
    // Get the auth user record (this should have the real Google data)
    const authUser = await ctx.db.get(userId);
    if (!authUser) return null;
    
    console.log("Real Google auth user:", authUser);
    
    // Check if user exists in our custom users table
    const customUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();
    
    // If no custom user record, return the auth user data
    if (!customUser) {
      return {
        _id: authUser._id,
        email: authUser.email,
        name: authUser.name,
        image: authUser.image,
        profilePicture: authUser.image,
        role: undefined
      };
    }
    
    // Merge custom user data with real auth user data
    return {
      ...customUser,
      image: authUser.image,
      profilePicture: authUser.image,
      name: authUser.name || customUser.name,
      email: authUser.email || customUser.email
    };
  },
});

export const updateUserRole = mutation({
  args: { 
    role: v.union(v.literal("student"), v.literal("teacher"))
  },
  handler: async (ctx, { role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const userId = identity.subject.split('|')[0] as Id<"users">;
    const authUser = await ctx.db.get(userId);
    if (!authUser) throw new Error("Auth user not found");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();
    
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(user._id, { role });
    return await ctx.db.get(user._id);
  },
});

export const autoRegisterUser = mutation({
  args: { 
    name: v.string()
  },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const userId = identity.subject.split('|')[0] as Id<"users">;
    const authUser = await ctx.db.get(userId);
    if (!authUser) throw new Error("Auth user not found");
    
    console.log("Real Google user data:", authUser);
    
    // Check if user already exists in our custom users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user with real Google data
    const newUserId = await ctx.db.insert("users", {
      email: authUser.email,
      name: authUser.name || name,
    });
    
    return await ctx.db.get(newUserId);
  },
});

export const registerUser = mutation({
  args: { 
    name: v.string(), 
    role: v.union(v.literal("student"), v.literal("teacher"))
  },
  handler: async (ctx, { name, role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Extract the user ID from the identity subject (before the first |)
    const userId = identity.subject.split('|')[0] as Id<"users">;
    
    console.log("Looking for userId:", userId);
    
    // Look up the user's auth account to get email
    const authAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .first();
    
    if (!authAccount) {
      throw new Error(`No auth account found for user ${userId}`);
    }
    
    const email = authAccount.emailVerified;
    if (!email) {
      throw new Error("No email found in auth account");
    }
    
    console.log("Registering user with auth account lookup:", { userId, email, name, role });
    
    // Check if user already exists in our users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    
    if (existingUser) {
      // Update existing user with role
      await ctx.db.patch(existingUser._id, { name, role });
      return await ctx.db.get(existingUser._id);
    } else {
      // Create new user
      const newUserId = await ctx.db.insert("users", {
        email,
        name,
        role,
      });
      
      return await ctx.db.get(newUserId);
    }
  },
});

export const createClass = mutation({
  args: { 
    name: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, { name, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const userId = identity.subject.split('|')[0] as Id<"users">;
    const authAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .first();
    
    if (!authAccount) throw new Error("No auth account found");
    
    const email = `user-${authAccount.providerAccountId}@gmail.com`;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    
    if (!user || user.role !== "teacher") throw new Error("Only teachers can create classes");
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return await ctx.db.insert("classes", {
      name,
      code,
      teacherId: user.email,
      description,
    });
  },
});

export const joinClass = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "sriramramnath2011@gmail.com"))
      .first();
    
    if (!user || user.role !== "student") throw new Error("Only students can join classes");
    
    const classDoc = await ctx.db
      .query("classes")
      .withIndex("code", (q) => q.eq("code", code))
      .first();
    
    if (!classDoc) throw new Error("Class not found");
    
    // Check if already joined
    const existing = await ctx.db
      .query("classMembers")
      .withIndex("class", (q) => q.eq("classId", classDoc._id))
      .filter((q) => q.eq(q.field("studentId"), user.email))
      .first();
    
    if (existing) throw new Error("Already joined this class");
    
    await ctx.db.insert("classMembers", {
      classId: classDoc._id,
      studentId: user.email,
      joinedAt: Date.now(),
    });
    
    return classDoc;
  },
});

export const getMyClasses = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "sriramramnath2011@gmail.com"))
      .first();
    
    if (!user) return [];
    
    if (user.role === "teacher") {
      return await ctx.db
        .query("classes")
        .withIndex("teacher", (q) => q.eq("teacherId", user.email))
        .collect();
    } else {
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("student", (q) => q.eq("studentId", user.email))
        .collect();
      
      const classes = [];
      for (const membership of memberships) {
        const classDoc = await ctx.db.get(membership.classId);
        if (classDoc) classes.push(classDoc);
      }
      return classes;
    }
  },
});

export const getClassFiles = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "sriramramnath2011@gmail.com"))
      .first();
    
    if (!user) return [];
    
    return await ctx.db
      .query("files")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();
  },
});

export const uploadFile = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    classId: v.id("classes"),
    isAssignment: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "sriramramnath2011@gmail.com"))
      .first();
    
    if (!user || user.role !== "teacher") throw new Error("Only teachers can upload files");

    const editable = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ].includes(args.mimeType);

    return await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      mimeType: args.mimeType,
      size: args.size,
      storageId: args.storageId,
      classId: args.classId,
      uploadedBy: user.email,
      editable,
      isAssignment: args.isAssignment,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

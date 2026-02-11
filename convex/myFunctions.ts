import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to get consistent user data from identity
async function getCurrentUserData(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // The userId in Convex Auth is the subject before the first |
  const authUserId = identity.subject.split('|')[0] as Id<"users">;
  const authUser = await ctx.db.get(authUserId);
  if (!authUser) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", authUser.email))
    .first();

  return { authUser, user };
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingle(text: string, size = 3) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - size; i += 1) {
    shingles.add(words.slice(i, i + size).join(" "));
  }
  return shingles;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

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
    const data = await getCurrentUserData(ctx);
    if (!data) return null;

    const { authUser, user } = data;

    // If no custom user record, return the auth user data
    if (!user) {
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
      ...user,
      image: authUser.image,
      profilePicture: authUser.image,
      name: authUser.name || user.name,
      email: authUser.email || user.email
    };
  },
});

export const updateUserRole = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("teacher"))
  },
  handler: async (ctx, { role }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");

    await ctx.db.patch(data.user._id, { role });
    return await ctx.db.get(data.user._id);
  },
});

export const autoRegisterUser = mutation({
  args: {
    name: v.string()
  },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const authUserId = identity.subject.split('|')[0] as Id<"users">;
    const authUser = await ctx.db.get(authUserId);
    if (!authUser) throw new Error("Auth user not found");

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

    const authUserId = identity.subject.split('|')[0] as Id<"users">;
    const authUser = await ctx.db.get(authUserId);
    if (!authUser) throw new Error("Auth user not found");

    const email = authUser.email;
    if (!email) throw new Error("No email found");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { name, role });
      return await ctx.db.get(existingUser._id);
    } else {
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
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create classes");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    return await ctx.db.insert("classes", {
      name,
      code,
      teacherId: data.user.email,
      description,
    });
  },
});

export const joinClass = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    const user = data.user;
    if (user.role !== "student") throw new Error("Only students can join classes");

    const classDoc = await ctx.db
      .query("classes")
      .withIndex("code", (q) => q.eq("code", code))
      .first();

    if (!classDoc) throw new Error("Class not found");

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
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    const user = data.user;

    let classes = [];
    if (user.role === "teacher") {
      classes = await ctx.db
        .query("classes")
        .withIndex("teacher", (q) => q.eq("teacherId", user.email))
        .collect();
    } else {
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("student", (q) => q.eq("studentId", user.email))
        .collect();

      for (const membership of memberships) {
        const classDoc = await ctx.db.get(membership.classId);
        if (classDoc) classes.push(classDoc);
      }
    }

    // Enrich with banner URLs
    const enrichedClasses = await Promise.all(
      classes.map(async (c) => {
        let bannerUrl = null;
        if (c.bannerStorageId) {
          bannerUrl = await ctx.storage.getUrl(c.bannerStorageId);
        }
        return { ...c, bannerUrl };
      })
    );

    return enrichedClasses;
  },
});

export const getClassFiles = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];

    return await ctx.db
      .query("files")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();
  },
});

export const getClassLinks = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];

    return await ctx.db
      .query("links")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();
  },
});

export const getOutcomes = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    return await ctx.db.query("outcomes").withIndex("class", (q) => q.eq("classId", classId)).collect();
  },
});

export const createOutcome = mutation({
  args: {
    classId: v.id("classes"),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { classId, code, title, description }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create outcomes");
    return await ctx.db.insert("outcomes", { classId, code, title, description });
  },
});

export const updateAssignmentDetails = mutation({
  args: {
    fileId: v.id("files"),
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
    outcomeIds: v.optional(v.array(v.id("outcomes"))),
  },
  handler: async (ctx, { fileId, dueDate, instructions, outcomeIds }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can edit assignments");
    await ctx.db.patch(fileId, { dueDate, instructions, outcomeIds });
    return await ctx.db.get(fileId);
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
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
    outcomeIds: v.optional(v.array(v.id("outcomes"))),
  },
  handler: async (ctx, args) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can upload files");

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
      uploadedBy: data.user.email,
      editable,
      isAssignment: args.isAssignment,
      dueDate: args.dueDate,
      instructions: args.instructions,
      outcomeIds: args.outcomeIds,
    });
  },
});

export const createLink = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    url: v.string(),
    isWhiteboard: v.optional(v.boolean()),
  },
  handler: async (ctx, { classId, title, url, isWhiteboard }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create links");

    return await ctx.db.insert("links", {
      classId,
      title,
      url,
      createdBy: data.user.email,
      isWhiteboard,
    });
  },
});

export const createReflection = mutation({
  args: {
    classId: v.id("classes"),
    mood: v.string(),
    goal: v.string(),
    blocker: v.string(),
  },
  handler: async (ctx, { classId, mood, goal, blocker }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "student") throw new Error("Only students can submit reflections");
    return await ctx.db.insert("reflections", {
      classId,
      studentId: data.user.email,
      mood,
      goal,
      blocker,
      createdAt: Date.now(),
    });
  },
});

export const getStudentReflections = query({
  args: { classId: v.id("classes"), studentId: v.string() },
  handler: async (ctx, { classId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role === "student" && data.user.email !== studentId) {
      throw new Error("Access denied");
    }
    return await ctx.db
      .query("reflections")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
  },
});

export const recordAttendance = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("tardy")),
    date: v.number(),
  },
  handler: async (ctx, { classId, studentId, status, date }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can record attendance");
    return await ctx.db.insert("attendanceRecords", {
      classId,
      studentId,
      status,
      date,
      recordedBy: data.user.email,
    });
  },
});

export const addInterventionNote = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.string(),
    note: v.string(),
    level: v.union(v.literal("note"), v.literal("concern"), v.literal("action")),
  },
  handler: async (ctx, { classId, studentId, note, level }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can add notes");
    return await ctx.db.insert("interventions", {
      classId,
      studentId,
      note,
      level,
      createdAt: Date.now(),
      createdBy: data.user.email,
    });
  },
});

export const createNudge = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.string(),
    assignmentId: v.id("files"),
    message: v.string(),
  },
  handler: async (ctx, { classId, studentId, assignmentId, message }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can send nudges");
    return await ctx.db.insert("nudges", {
      classId,
      studentId,
      assignmentId,
      message,
      createdAt: Date.now(),
      status: "sent",
    });
  },
});

export const getMissingAssignments = query({
  args: { classId: v.id("classes"), studentId: v.string() },
  handler: async (ctx, { classId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role === "student" && data.user.email !== studentId) {
      throw new Error("Access denied");
    }
    const now = Date.now();
    const assignments = await ctx.db
      .query("files")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("isAssignment"), true))
      .collect();

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("student", (q) => q.eq("studentId", studentId))
      .collect();
    const submittedIds = new Set(submissions.map((s) => s.assignmentId));

    return assignments
      .filter((a) => a.dueDate && a.dueDate < now && !submittedIds.has(a._id))
      .map((a) => ({
        _id: a._id,
        name: a.name,
        dueDate: a.dueDate,
        instructions: a.instructions,
        outcomeIds: a.outcomeIds || [],
      }));
  },
});

export const getOutcomeProgress = query({
  args: { classId: v.id("classes"), studentId: v.string() },
  handler: async (ctx, { classId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role === "student" && data.user.email !== studentId) {
      throw new Error("Access denied");
    }
    const outcomes = await ctx.db.query("outcomes").withIndex("class", (q) => q.eq("classId", classId)).collect();
    const assignments = await ctx.db
      .query("files")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("isAssignment"), true))
      .collect();
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("student", (q) => q.eq("studentId", studentId))
      .collect();
    const submittedIds = new Set(submissions.map((s) => s.assignmentId));

    return outcomes.map((outcome) => {
      const linkedAssignments = assignments.filter((a) => (a.outcomeIds || []).includes(outcome._id));
      const completed = linkedAssignments.filter((a) => submittedIds.has(a._id));
      return {
        outcome,
        total: linkedAssignments.length,
        completed: completed.length,
      };
    });
  },
});

export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("files"),
    classId: v.id("classes"),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { assignmentId, classId, content }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "student") throw new Error("Only students can submit assignments");
    return await ctx.db.insert("submissions", {
      assignmentId,
      studentId: data.user.email,
      classId,
      content,
      submittedAt: Date.now(),
    });
  },
});

export const getAssignmentSubmissions = query({
  args: { assignmentId: v.id("files") },
  handler: async (ctx, { assignmentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) return [];
    if (data.user.role !== "teacher") throw new Error("Only teachers can view submissions");
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignment", (q) => q.eq("assignmentId", assignmentId))
      .collect();
    return submissions;
  },
});

export const getStudentSubmissions = query({
  args: { classId: v.id("classes"), studentId: v.string() },
  handler: async (ctx, { classId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role === "student" && data.user.email !== studentId) {
      throw new Error("Access denied");
    }
    return await ctx.db
      .query("submissions")
      .withIndex("student", (q) => q.eq("studentId", studentId))
      .filter((q) => q.eq(q.field("classId"), classId))
      .collect();
  },
});

export const getSimilarityReport = query({
  args: { assignmentId: v.id("files"), studentId: v.string() },
  handler: async (ctx, { assignmentId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role !== "teacher") throw new Error("Only teachers can view similarity reports");
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignment", (q) => q.eq("assignmentId", assignmentId))
      .collect();
    const target = submissions.find((s) => s.studentId === studentId);
    if (!target?.content) return [];
    const targetShingles = shingle(target.content);
    const reports = submissions
      .filter((s) => s.studentId !== studentId && s.content)
      .map((s) => {
        const score = jaccardSimilarity(targetShingles, shingle(s.content || ""));
        return { studentId: s.studentId, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return reports;
  },
});

export const createForm = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("survey"), v.literal("permission"), v.literal("field_trip")),
    questions: v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.union(v.literal("short"), v.literal("long"), v.literal("single"), v.literal("multi")),
      options: v.optional(v.array(v.string())),
      required: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { classId, title, description, category, questions }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create forms");
    return await ctx.db.insert("forms", {
      classId,
      title,
      description,
      category,
      createdBy: data.user.email,
      isOpen: true,
      questions,
      createdAt: Date.now(),
    });
  },
});

export const setFormActive = mutation({
  args: {
    formId: v.id("forms"),
    isOpen: v.boolean(),
  },
  handler: async (ctx, { formId, isOpen }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can update forms");
    await ctx.db.patch(formId, { isOpen });
    return await ctx.db.get(formId);
  },
});

export const getForms = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    return await ctx.db.query("forms").withIndex("class", (q) => q.eq("classId", classId)).collect();
  },
});

export const submitForm = mutation({
  args: {
    formId: v.id("forms"),
    classId: v.id("classes"),
    answers: v.array(v.object({
      questionId: v.string(),
      value: v.string(),
    })),
  },
  handler: async (ctx, { formId, classId, answers }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "student") throw new Error("Only students can submit forms");
    return await ctx.db.insert("formResponses", {
      formId,
      classId,
      studentId: data.user.email,
      answers,
      submittedAt: Date.now(),
    });
  },
});

export const getFormResponses = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, { formId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role !== "teacher") throw new Error("Only teachers can view responses");
    return await ctx.db.query("formResponses").withIndex("form", (q) => q.eq("formId", formId)).collect();
  },
});

export const getStudentTimeline = query({
  args: { classId: v.id("classes"), studentId: v.string() },
  handler: async (ctx, { classId, studentId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    if (data.user.role === "student" && data.user.email !== studentId) {
      throw new Error("Access denied");
    }

    const attendance = await ctx.db
      .query("attendanceRecords")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const reflections = await ctx.db
      .query("reflections")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const interventions = await ctx.db
      .query("interventions")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const nudges = await ctx.db
      .query("nudges")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const grades = await ctx.db
      .query("grades")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const quizSubs = await ctx.db
      .query("quizSubmissions")
      .withIndex("student", (q) => q.eq("studentId", studentId))
      .collect();
    const responses = await ctx.db
      .query("formResponses")
      .withIndex("class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .collect();
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("user", (q) => q.eq("userId", studentId))
      .collect();
    const lessonIds = new Set(progress.map((p) => p.lessonId));
    const lessons = lessonIds.size
      ? await ctx.db.query("lessons").collect()
      : [];
    const lessonMap = new Map(lessons.map((l) => [l._id, l.title]));

    const events = [
      ...attendance.map((a) => ({
        type: "attendance",
        ts: a.date,
        title: `Attendance: ${a.status}`,
        detail: `Recorded by ${a.recordedBy.split("@")[0]}`,
      })),
      ...reflections.map((r) => ({
        type: "reflection",
        ts: r.createdAt,
        title: `Check-in: ${r.mood}`,
        detail: `Goal: ${r.goal || "—"} • Blocker: ${r.blocker || "—"}`,
      })),
      ...interventions.map((i) => ({
        type: "intervention",
        ts: i.createdAt,
        title: `Intervention (${i.level})`,
        detail: i.note,
      })),
      ...nudges.map((n) => ({
        type: "nudge",
        ts: n.createdAt,
        title: "Re-engagement nudge",
        detail: n.message,
      })),
      ...grades.map((g) => ({
        type: "grade",
        ts: g.updatedAt,
        title: "Grade update",
        detail: `Score: ${g.score ?? "—"} ${g.letterGrade ? `(${g.letterGrade})` : ""}`,
      })),
      ...quizSubs.map((q) => ({
        type: "quiz",
        ts: q.completedAt,
        title: "Quiz completed",
        detail: `${q.score}/${q.totalQuestions}`,
      })),
      ...responses.map((r) => ({
        type: "form",
        ts: r.submittedAt,
        title: "Form submitted",
        detail: `${r.answers.length} responses`,
      })),
      ...progress.map((p) => ({
        type: "lesson",
        ts: p.completedAt,
        title: "Lesson completed",
        detail: lessonMap.get(p.lessonId) || "Lesson",
      })),
    ];

    return events.sort((a, b) => b.ts - a.ts);
  },
});

export const createExam = mutation({
  args: {
    classId: v.id("classes"),
    name: v.string(),
    isVisibleToStudents: v.boolean(),
  },
  handler: async (ctx, { classId, name, isVisibleToStudents }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create exams");

    return await ctx.db.insert("exams", {
      classId,
      name,
      createdBy: data.user.email,
      isVisibleToStudents,
    });
  },
});

export const updateExam = mutation({
  args: {
    examId: v.id("exams"),
    name: v.optional(v.string()),
    isVisibleToStudents: v.optional(v.boolean()),
  },
  handler: async (ctx, { examId, name, isVisibleToStudents }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can update exams");

    const patch: { name?: string; isVisibleToStudents?: boolean } = {};
    if (name !== undefined) patch.name = name;
    if (isVisibleToStudents !== undefined) patch.isVisibleToStudents = isVisibleToStudents;
    if (Object.keys(patch).length === 0) return;

    await ctx.db.patch(examId, patch);
  },
});

export const deleteExam = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, { examId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can delete exams");

    const exam = await ctx.db.get(examId);
    if (!exam) return;

    const grades = await ctx.db
      .query("grades")
      .withIndex("exam", (q) => q.eq("examId", examId))
      .collect();
    for (const grade of grades) {
      await ctx.db.delete(grade._id);
    }

    await ctx.db.delete(examId);
  },
});

export const getClassExams = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];

    const exams = await ctx.db
      .query("exams")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    if (data.user.role === "teacher") return exams;
    return exams.filter((exam) => exam.isVisibleToStudents);
  },
});

export const getClassGrades = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];

    const grades = await ctx.db
      .query("grades")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    if (data.user.role === "teacher") return grades;

    return grades.filter((grade) => grade.studentId === data.user!.email);
  },
});

export const setGrade = mutation({
  args: {
    classId: v.id("classes"),
    examId: v.id("exams"),
    studentId: v.string(),
    score: v.optional(v.number()),
    letterGrade: v.optional(v.string()),
  },
  handler: async (ctx, { classId, examId, studentId, score, letterGrade }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can set grades");

    const existing = await ctx.db
      .query("grades")
      .withIndex("exam", (q) => q.eq("examId", examId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score,
        letterGrade,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("grades", {
      classId,
      examId,
      studentId,
      score,
      letterGrade,
      updatedAt: Date.now(),
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

export const getLearningPath = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return [];
    const user = data.user;

    const allLessons = await ctx.db.query("lessons").collect();
    const lessons = allLessons.filter((lesson) =>
      !("classId" in lesson) || lesson.classId === classId
    );
    lessons.sort((a, b) => a.order - b.order);
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("user", (q) => q.eq("userId", user.email))
      .collect();

    const progressMap = new Set(progress.map((p) => p.lessonId));

    return lessons.map((lesson) => ({
      ...lesson,
      isCompleted: progressMap.has(lesson._id),
    }));
  },
});

export const completeLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    const user = data.user;

    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("user", (q) => q.eq("userId", user.email))
      .filter((q) => q.eq(q.field("lessonId"), lessonId))
      .first();

    if (existingProgress) return { message: "Lesson already completed" };

    await ctx.db.insert("userProgress", {
      userId: user.email,
      lessonId,
      completedAt: Date.now(),
    });

    const newXp = (user.xp || 0) + lesson.xpAward;
    await ctx.db.patch(user._id, { xp: newXp });

    return { xpAwarded: lesson.xpAward, totalXp: newXp };
  },
});

export const getLeaderboard = query({
  args: { classId: v.optional(v.id("classes")) },
  handler: async (ctx, { classId }) => {
    if (classId) {
      // Get class members
      const memberships = await ctx.db
        .query("classMembers")
        .withIndex("class", (q) => q.eq("classId", classId))
        .collect();

      const members = [];
      for (const membership of memberships) {
        const student = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", membership.studentId))
          .first();
        if (student) members.push(student);
      }

      // Sort by XP
      return members
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, 10)
        .map((u) => ({
          _id: u._id,
          name: u.name,
          xp: u.xp || 0,
          image: u.image,
        }));
    }

    const users = await ctx.db
      .query("users")
      .withIndex("xp")
      .order("desc")
      .take(10);

    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      xp: u.xp || 0,
      image: u.image,
    }));
  },
});

export const adminCreateLesson = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    content: v.string(),
    pretext: v.optional(v.string()),
    dataContext: v.optional(v.string()),
    order: v.number(),
    xpAward: v.number(),
    questions: v.optional(v.array(v.object({
      prompt: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
      explanation: v.optional(v.string()),
    }))),
    flashcards: v.optional(v.array(v.object({
      front: v.string(),
      back: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user || data.user.role !== "teacher") {
      throw new Error("Only teachers can create lessons");
    }
    return await ctx.db.insert("lessons", args);
  },
});

export const adminDeleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user || data.user.role !== "teacher") {
      throw new Error("Only teachers can delete tasks");
    }

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("lesson", (q) => q.eq("lessonId", lessonId))
      .collect();
    for (const entry of progress) {
      await ctx.db.delete(entry._id);
    }

    await ctx.db.delete(lessonId);
    return { deleted: true };
  },
});

export const adminClearLearningPath = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user || data.user.role !== "teacher") {
      throw new Error("Only teachers can clear learning paths");
    }

    const allLessons = await ctx.db.query("lessons").collect();
    const lessons = allLessons.filter((lesson) =>
      !("classId" in lesson) || lesson.classId === classId
    );

    for (const lesson of lessons) {
      const progress = await ctx.db
        .query("userProgress")
        .withIndex("lesson", (q) => q.eq("lessonId", lesson._id))
        .collect();
      for (const entry of progress) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(lesson._id);
    }

    return { deletedLessons: lessons.length };
  },
});

export const getClassById = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    return await ctx.db.get(classId);
  },
});

export const getClassMembers = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const memberships = await ctx.db
      .query("classMembers")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    const members = [];
    for (const membership of memberships) {
      const student = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", membership.studentId))
        .first();
      if (student) members.push(student);
    }
    return members;
  },
});

export const getClassTeacher = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const classDoc = await ctx.db.get(classId);
    if (!classDoc) return null;

    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", classDoc.teacherId))
      .first();
  },
});

export const createAnnouncement = mutation({
  args: {
    classId: v.id("classes"),
    content: v.string(),
  },
  handler: async (ctx, { classId, content }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    // Both teachers and students can post announcements in this vision (or just teachers? user requested "make like text i can type")

    return await ctx.db.insert("announcements", {
      classId,
      content,
      authorEmail: data.user.email,
    });
  },
});

export const createQuiz = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctOption: v.number(),
    })),
    xpValue: v.number(),
    xpPerQuestion: v.optional(v.number()),
    timeLimitMinutes: v.optional(v.number()),
    gradesPublic: v.optional(v.boolean()),
    singleAttempt: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");
    if (data.user.role !== "teacher") throw new Error("Only teachers can create quizzes");

    return await ctx.db.insert("quizzes", {
      classId: args.classId,
      title: args.title,
      questions: args.questions,
      authorEmail: data.user.email,
      xpValue: args.xpValue,
      xpPerQuestion: args.xpPerQuestion,
      timeLimitMinutes: args.timeLimitMinutes,
      gradesPublic: args.gradesPublic,
      singleAttempt: args.singleAttempt,
      dueDate: args.dueDate,
    });
  },
});

export const getStreamEntries = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const files = await ctx.db
      .query("files")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    const announcements = await ctx.db
      .query("announcements")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    const links = await ctx.db
      .query("links")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    // Map entries to a common format
    const fileEntries = files.map(f => ({ ...f, entryType: "file" }));
    const announcementEntries = announcements.map(a => ({ ...a, entryType: "announcement" }));
    const linkEntries = links.map(l => ({ ...l, entryType: "link" }));
    const quizEntries = quizzes.map(q => ({ ...q, entryType: "quiz" }));

    // Merge and sort by creation time (most recent first)
    const combined = [...fileEntries, ...announcementEntries, ...linkEntries, ...quizEntries];
    return combined.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
export const updateClassBanner = mutation({
  args: {
    classId: v.id("classes"),
    bannerStorageId: v.id("_storage"),
  },
  handler: async (ctx, { classId, bannerStorageId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");

    const classDoc = await ctx.db.get(classId);
    if (!classDoc) throw new Error("Class not found");

    // Security check: only the teacher of this class can update the banner
    if (classDoc.teacherId !== data.user.email) {
      throw new Error("Only the teacher of this class can update the banner");
    }

    await ctx.db.patch(classId, { bannerStorageId });
    return { success: true };
  },
});
export const completeQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    score: v.number(),
    totalQuestions: v.number(),
  },
  handler: async (ctx, { quizId, score, totalQuestions }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) throw new Error("User not found");

    const quiz = await ctx.db.get(quizId);
    if (!quiz) throw new Error("Quiz not found");

    const existingSubmission = await ctx.db
      .query("quizSubmissions")
      .withIndex("quiz", (q) => q.eq("quizId", quizId))
      .filter((q) => q.eq(q.field("studentId"), data.user!.email))
      .first();

    await ctx.db.insert("quizSubmissions", {
      quizId,
      studentId: data.user.email,
      score,
      totalQuestions,
      completedAt: Date.now(),
    });

    // Award XP only on the first completion
    const xpAward = existingSubmission ? 0 : (quiz.xpPerQuestion ? score * quiz.xpPerQuestion : score * 5);
    if (!existingSubmission) {
      await ctx.db.patch(data.user._id, {
        xp: (data.user.xp || 0) + xpAward,
      });
    }

    return { success: true, xpAwarded: xpAward, alreadyCompleted: !!existingSubmission };
  },
});

// Query to check if user has already submitted a quiz
export const hasSubmittedQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user) return false;

    const submission = await ctx.db
      .query("quizSubmissions")
      .withIndex("quiz", (q) => q.eq("quizId", quizId))
      .filter((q) => q.eq(q.field("studentId"), data.user!.email))
      .first();

    return !!submission;
  },
});

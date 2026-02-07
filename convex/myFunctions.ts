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

    const units = await ctx.db
      .query("units")
      .withIndex("class", (q) => q.eq("classId", classId))
      .collect();

    // sorting by order manually since we used class index
    units.sort((a, b) => a.order - b.order);

    const lessons = await ctx.db.query("lessons").withIndex("order").collect();
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("user", (q) => q.eq("userId", user.email))
      .collect();

    const progressMap = new Set(progress.map((p) => p.lessonId));

    return units.map((unit) => ({
      ...unit,
      lessons: lessons
        .filter((lesson) => lesson.unitId === unit._id)
        .map((lesson) => ({
          ...lesson,
          isCompleted: progressMap.has(lesson._id),
        })),
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

export const adminCreateUnit = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    description: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("units", {
      classId: args.classId,
      title: args.title,
      description: args.description,
      order: args.order,
    });
  },
});

export const adminCreateLesson = mutation({
  args: {
    unitId: v.id("units"),
    title: v.string(),
    content: v.string(),
    order: v.number(),
    xpAward: v.number(),
  },
  handler: async (ctx, args) => {
    const data = await getCurrentUserData(ctx);
    if (!data || !data.user || data.user.role !== "teacher") {
      throw new Error("Only teachers can create lessons");
    }
    return await ctx.db.insert("lessons", args);
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

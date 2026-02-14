import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

type Ctx = QueryCtx | MutationCtx;

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

async function getCurrentUserData(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const db: any = ctx.db;
  const authUserId = identity.subject.split("|")[0] as Id<"users">;
  const authUser = await db.get(authUserId);
  if (!authUser) return null;

  const user = await db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", authUser.email))
    .first();

  return { identity, authUser, user };
}

async function requireUser(ctx: Ctx) {
  const data = await getCurrentUserData(ctx);
  if (!data || !data.user) {
    throw new Error("User not found");
  }
  return data.user;
}

async function getClassOrThrow(ctx: Ctx, classId: any) {
  const db: any = ctx.db;
  const classDoc = await db.get(classId);
  if (!classDoc) throw new Error("Class not found");
  return classDoc;
}

async function assertTeacherOfClass(ctx: Ctx, classId: any, userEmail: string) {
  const classDoc = await getClassOrThrow(ctx, classId);
  if (classDoc.teacherId !== userEmail) {
    throw new Error("Only the class teacher can do this");
  }
  return classDoc;
}

async function isClassMember(ctx: Ctx, classId: any, email: string) {
  const db: any = ctx.db;
  const classDoc = await db.get(classId);
  if (!classDoc) return false;
  if (classDoc.teacherId === email) return true;

  const membership = await db
    .query("classMembers")
    .withIndex("class", (q: any) => q.eq("classId", classId))
    .filter((q: any) => q.eq(q.field("studentId"), email))
    .first();

  return !!membership;
}

function sameDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

async function bumpActivity(ctx: MutationCtx, user: any) {
  const now = Date.now();
  const last = user.lastActiveAt;
  const currentStreak = user.streak || 0;

  let nextStreak = currentStreak;
  if (!last) {
    nextStreak = 1;
  } else if (sameDay(now, last)) {
    nextStreak = currentStreak;
  } else if (now - last <= DAY_MS * 2) {
    nextStreak = currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  const nextLevel = Math.max(1, Math.floor((user.xp || 0) / 100) + 1);
  await (ctx.db as any).patch(user._id, {
    lastActiveAt: now,
    streak: nextStreak,
    level: nextLevel,
  });
}

async function getNotificationPref(ctx: Ctx, userEmail: string) {
  const db: any = ctx.db;
  return await db
    .query("notificationPrefs")
    .withIndex("user", (q: any) => q.eq("userEmail", userEmail))
    .first();
}

async function shouldSendNotification(ctx: Ctx, userEmail: string, type: string) {
  const pref = await getNotificationPref(ctx, userEmail);
  if (!pref) return true;

  if (type === "announcement") return !!pref.classAnnouncements;
  if (type === "grade") return !!pref.gradeUpdates;
  if (type === "weekly") return !!pref.weeklySummary;
  if (type === "dm") return !!pref.directMessages;
  if (type === "due") return !!pref.dueReminders;
  return true;
}

async function createNotification(
  ctx: MutationCtx,
  params: {
    userEmail: string;
    type: string;
    title: string;
    body: string;
    classId?: any;
    link?: string;
  }
) {
  const allowed = await shouldSendNotification(ctx, params.userEmail, params.type);
  if (!allowed) return;

  await (ctx.db as any).insert("notifications", {
    userEmail: params.userEmail,
    type: params.type,
    title: params.title,
    body: params.body,
    classId: params.classId,
    link: params.link,
    read: false,
    createdAt: Date.now(),
  });
}

async function getClassStudentEmails(ctx: Ctx, classId: any) {
  const db: any = ctx.db;
  const members = await db
    .query("classMembers")
    .withIndex("class", (q: any) => q.eq("classId", classId))
    .collect();
  return members.map((m: any) => m.studentId);
}

export const updateClassLifecycle = mutation({
  args: {
    classId: v.id("classes"),
    archived: v.optional(v.boolean()),
    term: v.optional(v.string()),
    section: v.optional(v.string()),
  },
  handler: async (ctx, { classId, archived, term, section }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const patch: Record<string, any> = {};
    if (archived !== undefined) {
      patch.archived = archived;
      patch.archivedAt = archived ? Date.now() : undefined;
    }
    if (term !== undefined) patch.term = term.trim() || undefined;
    if (section !== undefined) patch.section = section.trim() || undefined;

    await (ctx.db as any).patch(classId, patch);
    return await (ctx.db as any).get(classId);
  },
});

export const duplicateClassWorkspace = mutation({
  args: {
    classId: v.id("classes"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { classId, name }) => {
    const user = await requireUser(ctx);
    const source = await assertTeacherOfClass(ctx, classId, user.email);
    const db: any = ctx.db;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClassId = await db.insert("classes", {
      name: name?.trim() || `${source.name} (Copy)`,
      code,
      teacherId: source.teacherId,
      description: source.description,
      bannerStorageId: source.bannerStorageId,
      term: source.term,
      section: source.section,
      archived: false,
    });

    const files = await db
      .query("files")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    for (const file of files) {
      await db.insert("files", {
        name: file.name,
        type: file.type,
        mimeType: file.mimeType,
        size: file.size,
        uploadedBy: user.email,
        classId: newClassId,
        storageId: file.storageId,
        editable: file.editable,
        isAssignment: file.isAssignment,
        dueDate: file.dueDate,
        instructions: file.instructions,
        questionPrompts: file.questionPrompts,
        outcomeIds: undefined,
        latePolicy: file.latePolicy,
        maxResubmissions: file.maxResubmissions,
        rubric: file.rubric,
        allowComments: file.allowComments,
      });
    }

    const links = await db
      .query("links")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    for (const link of links) {
      await db.insert("links", {
        classId: newClassId,
        title: link.title,
        url: link.url,
        createdBy: user.email,
        isWhiteboard: link.isWhiteboard,
      });
    }

    const outcomes = await db
      .query("outcomes")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    for (const outcome of outcomes) {
      await db.insert("outcomes", {
        classId: newClassId,
        code: outcome.code,
        title: outcome.title,
        description: outcome.description,
      });
    }

    return await db.get(newClassId);
  },
});

export const createClassInvite = mutation({
  args: {
    classId: v.id("classes"),
    expiresInHours: v.number(),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, { classId, expiresInHours, maxUses }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const inviteId = await (ctx.db as any).insert("classInvites", {
      classId,
      code,
      createdBy: user.email,
      expiresAt: Date.now() + Math.max(1, expiresInHours) * 60 * 60 * 1000,
      maxUses,
      uses: 0,
      isActive: true,
    });

    return await (ctx.db as any).get(inviteId);
  },
});

export const getClassInvites = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    await assertTeacherOfClass(ctx as any, classId, user.email);

    const invites = await (ctx.db as any)
      .query("classInvites")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    return invites.sort((a: any, b: any) => b._creationTime - a._creationTime);
  },
});

export const joinWithInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only students can join classes");

    const db: any = ctx.db;
    const invite = await db
      .query("classInvites")
      .withIndex("code", (q: any) => q.eq("code", code.trim().toUpperCase()))
      .first();

    if (!invite) throw new Error("Invite not found");
    if (!invite.isActive || invite.expiresAt < Date.now()) {
      throw new Error("Invite expired");
    }
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new Error("Invite usage limit reached");
    }

    const classDoc = await db.get(invite.classId);
    if (!classDoc) throw new Error("Class not found");
    if (classDoc.archived) throw new Error("Class is archived");

    const existing = await db
      .query("classMembers")
      .withIndex("class", (q: any) => q.eq("classId", classDoc._id))
      .filter((q: any) => q.eq(q.field("studentId"), user.email))
      .first();

    if (!existing) {
      await db.insert("classMembers", {
        classId: classDoc._id,
        studentId: user.email,
        joinedAt: Date.now(),
      });
    }

    await db.patch(invite._id, {
      uses: (invite.uses || 0) + 1,
      isActive: invite.maxUses ? invite.uses + 1 < invite.maxUses : invite.isActive,
    });

    return classDoc;
  },
});

export const requestJoinByClassCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only students can request access");

    const db: any = ctx.db;
    const classDoc = await db
      .query("classes")
      .withIndex("code", (q: any) => q.eq("code", code.trim().toUpperCase()))
      .first();

    if (!classDoc) throw new Error("Class not found");

    const existingMember = await db
      .query("classMembers")
      .withIndex("class", (q: any) => q.eq("classId", classDoc._id))
      .filter((q: any) => q.eq(q.field("studentId"), user.email))
      .first();

    if (existingMember) {
      return { status: "already_member" };
    }

    const existingRequest = await db
      .query("joinRequests")
      .withIndex("class", (q: any) => q.eq("classId", classDoc._id))
      .filter((q: any) => q.eq(q.field("studentId"), user.email))
      .first();

    if (existingRequest && existingRequest.status === "pending") {
      return { status: "pending" };
    }

    await db.insert("joinRequests", {
      classId: classDoc._id,
      studentId: user.email,
      status: "pending",
      requestedAt: Date.now(),
    });

    await createNotification(ctx, {
      userEmail: classDoc.teacherId,
      type: "announcement",
      title: "New Join Request",
      body: `${user.name || user.email} requested to join ${classDoc.name}`,
      classId: classDoc._id,
    });

    return { status: "submitted" };
  },
});

export const getJoinRequests = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    await assertTeacherOfClass(ctx as any, classId, user.email);

    const requests = await (ctx.db as any)
      .query("joinRequests")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const usersByEmail = new Map<string, any>();
    const db: any = ctx.db;

    for (const req of requests) {
      if (!usersByEmail.has(req.studentId)) {
        const student = await db
          .query("users")
          .withIndex("email", (q: any) => q.eq("email", req.studentId))
          .first();
        usersByEmail.set(req.studentId, student);
      }
    }

    return requests
      .sort((a: any, b: any) => b.requestedAt - a.requestedAt)
      .map((req: any) => ({
        ...req,
        student: usersByEmail.get(req.studentId),
      }));
  },
});

export const reviewJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, { requestId, decision }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const request = await db.get(requestId);
    if (!request) throw new Error("Request not found");

    await assertTeacherOfClass(ctx, request.classId, user.email);

    if (request.status !== "pending") {
      return { status: request.status };
    }

    if (decision === "approved") {
      const existingMember = await db
        .query("classMembers")
        .withIndex("class", (q: any) => q.eq("classId", request.classId))
        .filter((q: any) => q.eq(q.field("studentId"), request.studentId))
        .first();

      if (!existingMember) {
        await db.insert("classMembers", {
          classId: request.classId,
          studentId: request.studentId,
          joinedAt: Date.now(),
        });
      }
    }

    await db.patch(requestId, {
      status: decision,
      reviewedAt: Date.now(),
      reviewedBy: user.email,
    });

    await createNotification(ctx, {
      userEmail: request.studentId,
      type: "announcement",
      title: `Join request ${decision}`,
      body: `Your request to join the class has been ${decision}.`,
      classId: request.classId,
    });

    return { status: decision };
  },
});

export const addStreamComment = mutation({
  args: {
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("streamComments")),
  },
  handler: async (ctx, { classId, entryType, entryId, content, parentId }) => {
    const user = await requireUser(ctx);
    const member = await isClassMember(ctx, classId, user.email);
    if (!member) throw new Error("Not in class");

    const commentId = await (ctx.db as any).insert("streamComments", {
      classId,
      entryType,
      entryId,
      authorEmail: user.email,
      content: content.trim(),
      createdAt: Date.now(),
      parentId,
    });

    await bumpActivity(ctx, user);
    return await (ctx.db as any).get(commentId);
  },
});

export const getStreamComments = query({
  args: {
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
  },
  handler: async (ctx, { classId, entryType, entryId }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return [];

    const comments = await (ctx.db as any)
      .query("streamComments")
      .withIndex("entry", (q: any) => q.eq("entryType", entryType).eq("entryId", entryId))
      .collect();

    const usersByEmail = new Map<string, any>();
    const db: any = ctx.db;
    for (const comment of comments) {
      if (!usersByEmail.has(comment.authorEmail)) {
        const profile = await db
          .query("users")
          .withIndex("email", (q: any) => q.eq("email", comment.authorEmail))
          .first();
        usersByEmail.set(comment.authorEmail, profile);
      }
    }

    return comments
      .filter((c: any) => c.classId === classId)
      .sort((a: any, b: any) => a.createdAt - b.createdAt)
      .map((comment: any) => ({
        ...comment,
        author: usersByEmail.get(comment.authorEmail),
      }));
  },
});

export const toggleStreamReaction = mutation({
  args: {
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, { classId, entryType, entryId, emoji }) => {
    const user = await requireUser(ctx);
    const member = await isClassMember(ctx, classId, user.email);
    if (!member) throw new Error("Not in class");

    const db: any = ctx.db;
    const existing = await db
      .query("streamReactions")
      .withIndex("entry", (q: any) => q.eq("entryType", entryType).eq("entryId", entryId))
      .filter((q: any) => q.eq(q.field("userEmail"), user.email))
      .filter((q: any) => q.eq(q.field("emoji"), emoji))
      .first();

    if (existing) {
      await db.delete(existing._id);
    } else {
      await db.insert("streamReactions", {
        classId,
        entryType,
        entryId,
        userEmail: user.email,
        emoji,
        createdAt: Date.now(),
      });
    }

    const reactions = await db
      .query("streamReactions")
      .withIndex("entry", (q: any) => q.eq("entryType", entryType).eq("entryId", entryId))
      .collect();

    const counts: Record<string, number> = {};
    reactions.forEach((reaction: any) => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });

    return {
      counts,
      reacted: !existing,
    };
  },
});

export const getStreamReactions = query({
  args: {
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
  },
  handler: async (ctx, { classId, entryType, entryId }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return { counts: {}, mine: [] };

    const reactions = await (ctx.db as any)
      .query("streamReactions")
      .withIndex("entry", (q: any) => q.eq("entryType", entryType).eq("entryId", entryId))
      .collect();

    const counts: Record<string, number> = {};
    const mine: string[] = [];
    reactions.forEach((reaction: any) => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
      if (reaction.userEmail === user.email) mine.push(reaction.emoji);
    });

    return { counts, mine };
  },
});

export const pinStreamEntry = mutation({
  args: {
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
    pinned: v.boolean(),
  },
  handler: async (ctx, { classId, entryType, entryId, pinned }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);
    const db: any = ctx.db;

    if (entryType === "announcement") {
      await db.patch(entryId as any, { pinned });
      return { success: true };
    }

    throw new Error("Pinning is currently supported for announcements only");
  },
});

export const updateAnnouncementBody = mutation({
  args: {
    announcementId: v.id("announcements"),
    content: v.string(),
  },
  handler: async (ctx, { announcementId, content }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const announcement = await db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    const classDoc = await getClassOrThrow(ctx, announcement.classId);
    const canEdit = announcement.authorEmail === user.email || classDoc.teacherId === user.email;
    if (!canEdit) throw new Error("Cannot edit this post");

    const history = Array.isArray(announcement.editHistory) ? announcement.editHistory : [];
    history.push({
      content: announcement.content,
      editedAt: Date.now(),
      editedBy: user.email,
    });

    await db.patch(announcementId, {
      content: content.trim(),
      editedAt: Date.now(),
      editHistory: history,
    });

    return await db.get(announcementId);
  },
});

export const createScheduledAnnouncement = mutation({
  args: {
    classId: v.id("classes"),
    content: v.string(),
    scheduledFor: v.number(),
  },
  handler: async (ctx, { classId, content, scheduledFor }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const id = await (ctx.db as any).insert("announcements", {
      classId,
      content: content.trim(),
      authorEmail: user.email,
      scheduledFor,
      pinned: false,
    });

    return await (ctx.db as any).get(id);
  },
});

export const setAssignmentPolicy = mutation({
  args: {
    fileId: v.id("files"),
    latePolicy: v.optional(v.union(v.literal("allow"), v.literal("penalty"), v.literal("block"))),
    maxResubmissions: v.optional(v.number()),
    allowComments: v.optional(v.boolean()),
    rubric: v.optional(v.array(v.object({ criterion: v.string(), maxPoints: v.number() }))),
  },
  handler: async (ctx, { fileId, latePolicy, maxResubmissions, allowComments, rubric }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const file = await db.get(fileId);
    if (!file) throw new Error("Assignment not found");

    await assertTeacherOfClass(ctx, file.classId, user.email);

    await db.patch(fileId, {
      latePolicy,
      maxResubmissions,
      allowComments,
      rubric,
    });

    return await db.get(fileId);
  },
});

export const setStudentExtension = mutation({
  args: {
    assignmentId: v.id("files"),
    studentId: v.string(),
    extendedDueDate: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { assignmentId, studentId, extendedDueDate, reason }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const assignment = await db.get(assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    await assertTeacherOfClass(ctx, assignment.classId, user.email);

    const existing = await db
      .query("assignmentExtensions")
      .withIndex("assignment", (q: any) => q.eq("assignmentId", assignmentId))
      .filter((q: any) => q.eq(q.field("studentId"), studentId))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        extendedDueDate,
        reason,
        createdBy: user.email,
        createdAt: Date.now(),
      });
      return await db.get(existing._id);
    }

    const id = await db.insert("assignmentExtensions", {
      assignmentId,
      classId: assignment.classId,
      studentId,
      extendedDueDate,
      reason,
      createdBy: user.email,
      createdAt: Date.now(),
    });

    await createNotification(ctx, {
      userEmail: studentId,
      type: "due",
      title: "Assignment Extension Granted",
      body: `${assignment.name} due date was extended.`,
      classId: assignment.classId,
    });

    return await db.get(id);
  },
});

export const getAssignmentExtensions = query({
  args: {
    assignmentId: v.id("files"),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, { assignmentId, studentId }) => {
    const user = await requireUser(ctx as any);
    const db: any = ctx.db;
    const assignment = await db.get(assignmentId);
    if (!assignment) return [];

    if (user.role === "teacher") {
      await assertTeacherOfClass(ctx as any, assignment.classId, user.email);
    } else if (studentId && studentId !== user.email) {
      throw new Error("Access denied");
    }

    const rows = await db
      .query("assignmentExtensions")
      .withIndex("assignment", (q: any) => q.eq("assignmentId", assignmentId))
      .collect();

    return studentId ? rows.filter((row: any) => row.studentId === studentId) : rows;
  },
});

export const gradeAssignmentSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    score: v.optional(v.number()),
    feedback: v.optional(v.string()),
    rubricScores: v.optional(v.array(v.object({ criterion: v.string(), points: v.number() }))),
  },
  handler: async (ctx, { submissionId, score, feedback, rubricScores }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const submission = await db.get(submissionId);
    if (!submission) throw new Error("Submission not found");

    await assertTeacherOfClass(ctx, submission.classId, user.email);

    await db.patch(submissionId, {
      score,
      feedback,
      rubricScores,
      gradedAt: Date.now(),
      gradedBy: user.email,
    });

    await createNotification(ctx, {
      userEmail: submission.studentId,
      type: "grade",
      title: "Submission Graded",
      body: feedback ? "Feedback is available on your submission." : "Your submission was graded.",
      classId: submission.classId,
    });

    return await db.get(submissionId);
  },
});

export const createAdvancedQuiz = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctOption: v.number(),
      questionType: v.optional(v.union(v.literal("mcq"), v.literal("short"), v.literal("numeric"), v.literal("true_false"))),
      correctAnswerText: v.optional(v.string()),
      correctNumber: v.optional(v.number()),
      explanation: v.optional(v.string()),
    })),
    xpValue: v.number(),
    xpPerQuestion: v.optional(v.number()),
    timeLimitMinutes: v.optional(v.number()),
    gradesPublic: v.optional(v.boolean()),
    singleAttempt: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
    randomizeQuestions: v.optional(v.boolean()),
    randomizeOptions: v.optional(v.boolean()),
    maxAttempts: v.optional(v.number()),
    showExplanations: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, args.classId, user.email);

    const id = await (ctx.db as any).insert("quizzes", {
      classId: args.classId,
      title: args.title.trim(),
      questions: args.questions,
      authorEmail: user.email,
      xpValue: args.xpValue,
      xpPerQuestion: args.xpPerQuestion,
      timeLimitMinutes: args.timeLimitMinutes,
      gradesPublic: args.gradesPublic,
      singleAttempt: args.singleAttempt,
      dueDate: args.dueDate,
      randomizeQuestions: args.randomizeQuestions,
      randomizeOptions: args.randomizeOptions,
      maxAttempts: args.maxAttempts,
      showExplanations: args.showExplanations,
    });

    const students = await getClassStudentEmails(ctx, args.classId);
    await Promise.all(
      students.map((studentEmail: string) =>
        createNotification(ctx, {
          userEmail: studentEmail,
          type: "announcement",
          title: "New Quiz",
          body: `${args.title.trim()} is now available.`,
          classId: args.classId,
        })
      )
    );

    return await (ctx.db as any).get(id);
  },
});

export const getQuizAttemptInfo = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    const user = await requireUser(ctx as any);
    const db: any = ctx.db;

    const attempts = await db
      .query("quizSubmissions")
      .withIndex("quiz", (q: any) => q.eq("quizId", quizId))
      .filter((q: any) => q.eq(q.field("studentId"), user.email))
      .collect();

    const sorted = attempts.sort((a: any, b: any) => a.completedAt - b.completedAt);
    const latest = sorted.length ? sorted[sorted.length - 1] : null;

    return {
      attempts: attempts.length,
      latest,
    };
  },
});

export const completeAdvancedQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    score: v.number(),
    totalQuestions: v.number(),
  },
  handler: async (ctx, { quizId, score, totalQuestions }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const quiz = await db.get(quizId);
    if (!quiz) throw new Error("Quiz not found");

    const isMember = await isClassMember(ctx, quiz.classId, user.email);
    if (!isMember) throw new Error("Not in class");

    if (quiz.dueDate && Date.now() > quiz.dueDate) {
      throw new Error("Quiz is closed");
    }

    const existingAttempts = await db
      .query("quizSubmissions")
      .withIndex("quiz", (q: any) => q.eq("quizId", quizId))
      .filter((q: any) => q.eq(q.field("studentId"), user.email))
      .collect();

    const attemptNumber = existingAttempts.length + 1;

    if (quiz.singleAttempt && existingAttempts.length > 0) {
      throw new Error("Single attempt quiz");
    }

    if (quiz.maxAttempts && attemptNumber > quiz.maxAttempts) {
      throw new Error("Maximum attempts reached");
    }

    await db.insert("quizSubmissions", {
      quizId,
      studentId: user.email,
      score,
      totalQuestions,
      completedAt: Date.now(),
      attemptNumber,
    });

    const xpAward = attemptNumber === 1
      ? (quiz.xpPerQuestion ? score * quiz.xpPerQuestion : score * 5)
      : 0;

    if (xpAward > 0) {
      await db.patch(user._id, {
        xp: (user.xp || 0) + xpAward,
      });
    }

    await bumpActivity(ctx, user);

    return {
      success: true,
      attemptNumber,
      xpAwarded: xpAward,
      attemptsLeft: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - attemptNumber) : null,
    };
  },
});

export const setGradebookPolicy = mutation({
  args: {
    classId: v.id("classes"),
    categories: v.array(v.object({
      name: v.string(),
      weight: v.number(),
      dropLowest: v.optional(v.boolean()),
    })),
    curvePoints: v.optional(v.number()),
  },
  handler: async (ctx, { classId, categories, curvePoints }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const db: any = ctx.db;
    const existing = await db
      .query("gradebookPolicies")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        categories,
        curvePoints,
        updatedAt: Date.now(),
      });
      return await db.get(existing._id);
    }

    const id = await db.insert("gradebookPolicies", {
      classId,
      categories,
      curvePoints,
      updatedAt: Date.now(),
    });

    return await db.get(id);
  },
});

export const getGradebookPolicy = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return null;

    return await (ctx.db as any)
      .query("gradebookPolicies")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .first();
  },
});

export const exportGradesCsv = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    await assertTeacherOfClass(ctx as any, classId, user.email);

    const db: any = ctx.db;
    const exams = await db
      .query("exams")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const grades = await db
      .query("grades")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const members = await db
      .query("classMembers")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const headers = ["studentEmail", ...exams.map((e: any) => e.name)];
    const lines = [headers.join(",")];

    members.forEach((member: any) => {
      const row = [member.studentId];
      exams.forEach((exam: any) => {
        const grade = grades.find((g: any) => g.examId === exam._id && g.studentId === member.studentId);
        row.push(String(grade?.score ?? ""));
      });
      lines.push(row.join(","));
    });

    return lines.join("\n");
  },
});

export const getReportCard = query({
  args: {
    classId: v.id("classes"),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, { classId, studentId }) => {
    const user = await requireUser(ctx as any);
    const targetStudent = studentId || user.email;

    if (user.role === "student" && targetStudent !== user.email) {
      throw new Error("Access denied");
    }

    const db: any = ctx.db;
    if (user.role === "teacher") {
      await assertTeacherOfClass(ctx as any, classId, user.email);
    } else {
      const member = await isClassMember(ctx as any, classId, user.email);
      if (!member) throw new Error("Not in class");
    }

    const exams = await db
      .query("exams")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const grades = await db
      .query("grades")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .filter((q: any) => q.eq(q.field("studentId"), targetStudent))
      .collect();

    const policy = await db
      .query("gradebookPolicies")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .first();

    const scores = grades
      .map((grade: any) => grade.score)
      .filter((score: any) => typeof score === "number") as number[];

    let average = scores.length
      ? scores.reduce((sum, value) => sum + value, 0) / scores.length
      : null;

    if (average !== null && policy?.curvePoints) {
      average = Math.min(100, average + policy.curvePoints);
    }

    const letter = average === null
      ? null
      : average >= 90
        ? "A"
        : average >= 80
          ? "B"
          : average >= 70
            ? "C"
            : average >= 60
              ? "D"
              : "F";

    return {
      studentId: targetStudent,
      exams: exams.map((exam: any) => ({
        exam,
        grade: grades.find((grade: any) => grade.examId === exam._id) || null,
      })),
      average,
      letter,
      curvePoints: policy?.curvePoints || 0,
    };
  },
});

export const setLessonRules = mutation({
  args: {
    lessonId: v.id("lessons"),
    prerequisiteLessonIds: v.optional(v.array(v.id("lessons"))),
    masteryThreshold: v.optional(v.number()),
  },
  handler: async (ctx, { lessonId, prerequisiteLessonIds, masteryThreshold }) => {
    const user = await requireUser(ctx);
    if (user.role !== "teacher") throw new Error("Only teachers can update lesson rules");

    const lesson = await (ctx.db as any).get(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    if (lesson.classId) {
      await assertTeacherOfClass(ctx, lesson.classId, user.email);
    }

    await (ctx.db as any).patch(lessonId, {
      prerequisiteLessonIds,
      masteryThreshold,
    });

    return await (ctx.db as any).get(lessonId);
  },
});

export const getLessonRecommendations = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return [];

    const db: any = ctx.db;

    const lessons = (await db.query("lessons").collect())
      .filter((lesson: any) => !lesson.classId || lesson.classId === classId)
      .sort((a: any, b: any) => a.order - b.order);

    const progress = await db
      .query("userProgress")
      .withIndex("user", (q: any) => q.eq("userId", user.email))
      .collect();

    const completedIds = new Set(progress.map((entry: any) => entry.lessonId));

    return lessons
      .filter((lesson: any) => !completedIds.has(lesson._id))
      .map((lesson: any) => {
        const prereqs = lesson.prerequisiteLessonIds || [];
        const unlocked = prereqs.every((id: any) => completedIds.has(id));
        return {
          lesson,
          unlocked,
          blockedBy: prereqs.filter((id: any) => !completedIds.has(id)),
        };
      });
  },
});

export const getClassAnalyticsOverview = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    await assertTeacherOfClass(ctx as any, classId, user.email);

    const db: any = ctx.db;

    const members = await db
      .query("classMembers")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const assignments = await db
      .query("files")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .filter((q: any) => q.eq(q.field("isAssignment"), true))
      .collect();

    const submissions = await db
      .query("submissions")
      .collect();

    const classSubmissions = submissions.filter((submission: any) => submission.classId === classId);

    const quizzes = await db
      .query("quizzes")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const quizSubs = await db
      .query("quizSubmissions")
      .collect();

    const quizSet = new Set(quizzes.map((quiz: any) => quiz._id));
    const classQuizSubs = quizSubs.filter((submission: any) => quizSet.has(submission.quizId));

    const users = await Promise.all(
      members.map((member: any) =>
        db
          .query("users")
          .withIndex("email", (q: any) => q.eq("email", member.studentId))
          .first()
      )
    );

    const averageXp = users.length
      ? users.reduce((sum: number, profile: any) => sum + (profile?.xp || 0), 0) / users.length
      : 0;

    const averageQuizScore = classQuizSubs.length
      ? classQuizSubs.reduce((sum: number, item: any) => sum + (item.score / Math.max(1, item.totalQuestions)) * 100, 0) / classQuizSubs.length
      : 0;

    const now = Date.now();
    const overdueAssignments = assignments.filter((assignment: any) => assignment.dueDate && assignment.dueDate < now);

    const atRisk: any[] = [];

    for (const member of members) {
      const missing = overdueAssignments.filter((assignment: any) =>
        !classSubmissions.some((submission: any) =>
          submission.assignmentId === assignment._id && submission.studentId === member.studentId
        )
      ).length;

      const personalQuiz = classQuizSubs.filter((submission: any) => submission.studentId === member.studentId);
      const avgQuiz = personalQuiz.length
        ? personalQuiz.reduce((sum: number, item: any) => sum + item.score / Math.max(1, item.totalQuestions), 0) / personalQuiz.length
        : 0;

      if (missing >= 2 || avgQuiz < 0.55) {
        atRisk.push({
          studentId: member.studentId,
          missingAssignments: missing,
          avgQuiz: Math.round(avgQuiz * 100),
          risk: missing >= 3 || avgQuiz < 0.4 ? "high" : "medium",
        });
      }
    }

    return {
      totalStudents: members.length,
      totalAssignments: assignments.length,
      totalSubmissions: classSubmissions.length,
      averageXp: Math.round(averageXp),
      averageQuizScore: Math.round(averageQuizScore),
      atRisk,
    };
  },
});

export const createInterventionTask = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.string(),
    assignedTo: v.string(),
    noteId: v.optional(v.id("interventions")),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, { classId, studentId, assignedTo, noteId, dueAt }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const id = await (ctx.db as any).insert("interventionTasks", {
      classId,
      studentId,
      assignedTo,
      noteId,
      status: "open",
      dueAt,
      createdBy: user.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userEmail: assignedTo,
      type: "announcement",
      title: "Intervention Task Assigned",
      body: `New intervention task for ${studentId}.`,
      classId,
    });

    return await (ctx.db as any).get(id);
  },
});

export const updateInterventionTask = mutation({
  args: {
    taskId: v.id("interventionTasks"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
    assignedTo: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, { taskId, status, assignedTo, dueAt }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const task = await db.get(taskId);
    if (!task) throw new Error("Task not found");
    await assertTeacherOfClass(ctx, task.classId, user.email);

    await db.patch(taskId, {
      status,
      assignedTo: assignedTo || task.assignedTo,
      dueAt,
      updatedAt: Date.now(),
    });

    return await db.get(taskId);
  },
});

export const getInterventionTasks = query({
  args: {
    classId: v.id("classes"),
    studentId: v.optional(v.string()),
  },
  handler: async (ctx, { classId, studentId }) => {
    const user = await requireUser(ctx as any);

    if (user.role === "teacher") {
      await assertTeacherOfClass(ctx as any, classId, user.email);
    } else {
      const member = await isClassMember(ctx as any, classId, user.email);
      if (!member) return [];
    }

    const rows = await (ctx.db as any)
      .query("interventionTasks")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    return rows
      .filter((row: any) => !studentId || row.studentId === studentId)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  },
});

export const updateFormDefinition = mutation({
  args: {
    formId: v.id("forms"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isOpen: v.optional(v.boolean()),
    enforceOneResponse: v.optional(v.boolean()),
    questions: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.union(v.literal("short"), v.literal("long"), v.literal("single"), v.literal("multi")),
      options: v.optional(v.array(v.string())),
      required: v.optional(v.boolean()),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const form = await db.get(args.formId);
    if (!form) throw new Error("Form not found");

    await assertTeacherOfClass(ctx, form.classId, user.email);

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.isOpen !== undefined) patch.isOpen = args.isOpen;
    if (args.enforceOneResponse !== undefined) patch.enforceOneResponse = args.enforceOneResponse;
    if (args.questions !== undefined) patch.questions = args.questions;

    await db.patch(args.formId, patch);
    return await db.get(args.formId);
  },
});

export const getFormAnalytics = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, { formId }) => {
    const user = await requireUser(ctx as any);
    const db: any = ctx.db;

    const form = await db.get(formId);
    if (!form) return null;

    await assertTeacherOfClass(ctx as any, form.classId, user.email);

    const responses = await db
      .query("formResponses")
      .withIndex("form", (q: any) => q.eq("formId", formId))
      .collect();

    const questionStats: Record<string, { count: number; filled: number }> = {};
    form.questions.forEach((question: any) => {
      questionStats[question.id] = { count: responses.length, filled: 0 };
    });

    responses.forEach((response: any) => {
      response.answers.forEach((answer: any) => {
        if (questionStats[answer.questionId] && String(answer.value || "").trim()) {
          questionStats[answer.questionId].filled += 1;
        }
      });
    });

    return {
      totalResponses: responses.length,
      completionRate: form.questions.length === 0 || responses.length === 0
        ? 0
        : Math.round(
          (Object.values(questionStats).reduce((sum, stat) => sum + stat.filled, 0) /
            (responses.length * form.questions.length)) * 100
        ),
      questionStats,
    };
  },
});

export const getNotificationPrefs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);
    const pref = await getNotificationPref(ctx as any, user.email);

    if (pref) return pref;

    return {
      userEmail: user.email,
      classAnnouncements: true,
      gradeUpdates: true,
      weeklySummary: false,
      directMessages: true,
      dueReminders: true,
    };
  },
});

export const updateNotificationPrefs = mutation({
  args: {
    classAnnouncements: v.boolean(),
    gradeUpdates: v.boolean(),
    weeklySummary: v.boolean(),
    directMessages: v.boolean(),
    dueReminders: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const existing = await db
      .query("notificationPrefs")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .first();

    if (existing) {
      await db.patch(existing._id, args);
      return await db.get(existing._id);
    }

    const id = await db.insert("notificationPrefs", {
      userEmail: user.email,
      ...args,
    });

    return await db.get(id);
  },
});

export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);
    const notifications = await (ctx.db as any)
      .query("notifications")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .collect();

    return notifications.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    read: v.boolean(),
  },
  handler: async (ctx, { notificationId, read }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const note = await db.get(notificationId);
    if (!note || note.userEmail !== user.email) throw new Error("Notification not found");

    await db.patch(notificationId, { read });
    return await db.get(notificationId);
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const notes = await db
      .query("notifications")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .collect();

    await Promise.all(notes.map((note: any) => db.patch(note._id, { read: true })));
    return { updated: notes.length };
  },
});

export const sendDirectMessage = mutation({
  args: {
    classId: v.id("classes"),
    recipientEmail: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { classId, recipientEmail, content }) => {
    const user = await requireUser(ctx);
    const isSenderMember = await isClassMember(ctx, classId, user.email);
    const isRecipientMember = await isClassMember(ctx, classId, recipientEmail);

    if (!isSenderMember || !isRecipientMember) {
      throw new Error("Both users must belong to the class");
    }

    const id = await (ctx.db as any).insert("directMessages", {
      classId,
      senderEmail: user.email,
      recipientEmail,
      content: content.trim(),
      createdAt: Date.now(),
      isFlagged: false,
    });

    await createNotification(ctx, {
      userEmail: recipientEmail,
      type: "dm",
      title: "New Message",
      body: `${user.name || user.email} sent you a message`,
      classId,
    });

    await bumpActivity(ctx, user);
    return await (ctx.db as any).get(id);
  },
});

export const getDirectMessages = query({
  args: {
    classId: v.id("classes"),
    peerEmail: v.string(),
  },
  handler: async (ctx, { classId, peerEmail }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return [];

    const rows = await (ctx.db as any)
      .query("directMessages")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    return rows
      .filter(
        (msg: any) =>
          (msg.senderEmail === user.email && msg.recipientEmail === peerEmail) ||
          (msg.senderEmail === peerEmail && msg.recipientEmail === user.email)
      )
      .sort((a: any, b: any) => a.createdAt - b.createdAt);
  },
});

export const moderateMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    action: v.union(v.literal("flag"), v.literal("unflag"), v.literal("delete")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { messageId, action, reason }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;
    const msg = await db.get(messageId);
    if (!msg) throw new Error("Message not found");

    await assertTeacherOfClass(ctx, msg.classId, user.email);

    if (action === "delete") {
      await db.insert("messageAudit", {
        messageId,
        action,
        actorEmail: user.email,
        reason,
        createdAt: Date.now(),
      });
      await db.delete(messageId);
      return { deleted: true };
    }

    await db.patch(messageId, { isFlagged: action === "flag" });
    await db.insert("messageAudit", {
      messageId,
      action,
      actorEmail: user.email,
      reason,
      createdAt: Date.now(),
    });

    return await db.get(messageId);
  },
});

export const addFileComment = mutation({
  args: {
    fileId: v.id("files"),
    classId: v.id("classes"),
    content: v.string(),
    targetSubmissionId: v.optional(v.id("submissions")),
  },
  handler: async (ctx, { fileId, classId, content, targetSubmissionId }) => {
    const user = await requireUser(ctx);
    const member = await isClassMember(ctx, classId, user.email);
    if (!member) throw new Error("Not in class");

    const id = await (ctx.db as any).insert("fileComments", {
      fileId,
      classId,
      authorEmail: user.email,
      content: content.trim(),
      targetSubmissionId,
      createdAt: Date.now(),
    });

    return await (ctx.db as any).get(id);
  },
});

export const getFileComments = query({
  args: {
    fileId: v.id("files"),
    classId: v.id("classes"),
    targetSubmissionId: v.optional(v.id("submissions")),
  },
  handler: async (ctx, { fileId, classId, targetSubmissionId }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return [];

    const comments = await (ctx.db as any)
      .query("fileComments")
      .withIndex("file", (q: any) => q.eq("fileId", fileId))
      .collect();

    return comments
      .filter((comment: any) =>
        comment.classId === classId &&
        (targetSubmissionId ? comment.targetSubmissionId === targetSubmissionId : true)
      )
      .sort((a: any, b: any) => a.createdAt - b.createdAt);
  },
});

export const compareSubmissionPair = query({
  args: {
    leftSubmissionId: v.id("submissions"),
    rightSubmissionId: v.id("submissions"),
  },
  handler: async (ctx, { leftSubmissionId, rightSubmissionId }) => {
    const user = await requireUser(ctx as any);
    if (user.role !== "teacher") throw new Error("Only teachers can compare submissions");

    const db: any = ctx.db;
    const left = await db.get(leftSubmissionId);
    const right = await db.get(rightSubmissionId);
    if (!left || !right) throw new Error("Submission not found");
    if (left.assignmentId !== right.assignmentId) {
      throw new Error("Pick submissions from the same assignment");
    }

    await assertTeacherOfClass(ctx as any, left.classId, user.email);

    const leftText = left.content || "";
    const rightText = right.content || "";

    const leftSet = shingle(leftText);
    const rightSet = shingle(rightText);
    const score = jaccardSimilarity(leftSet, rightSet);

    const overlap = [...leftSet].filter((chunk) => rightSet.has(chunk)).slice(0, 10);

    return {
      leftSubmissionId,
      rightSubmissionId,
      score,
      overlap,
    };
  },
});

export const createCalendarEvent = mutation({
  args: {
    classId: v.id("classes"),
    title: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    eventType: v.optional(v.string()),
    eventId: v.optional(v.string()),
  },
  handler: async (ctx, { classId, title, description, startAt, endAt, eventType, eventId }) => {
    const user = await requireUser(ctx);
    await assertTeacherOfClass(ctx, classId, user.email);

    const id = await (ctx.db as any).insert("calendarEvents", {
      classId,
      title: title.trim(),
      description,
      startAt,
      endAt,
      eventType: eventType || "custom",
      eventId,
      createdBy: user.email,
    });

    const students = await getClassStudentEmails(ctx, classId);
    await Promise.all(
      students.map((studentEmail: string) =>
        createNotification(ctx, {
          userEmail: studentEmail,
          type: "due",
          title: "Calendar Event Added",
          body: title.trim(),
          classId,
        })
      )
    );

    return await (ctx.db as any).get(id);
  },
});

export const getClassCalendar = query({
  args: {
    classId: v.id("classes"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, { classId, from, to }) => {
    const user = await requireUser(ctx as any);
    const member = await isClassMember(ctx as any, classId, user.email);
    if (!member) return [];

    const start = from || Date.now() - DAY_MS * 14;
    const end = to || Date.now() + DAY_MS * 60;

    const db: any = ctx.db;
    const files = await db
      .query("files")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();
    const quizzes = await db
      .query("quizzes")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();
    const forms = await db
      .query("forms")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();
    const custom = await db
      .query("calendarEvents")
      .withIndex("class", (q: any) => q.eq("classId", classId))
      .collect();

    const events = [
      ...files
        .filter((file: any) => file.dueDate)
        .map((file: any) => ({
          id: `assignment-${file._id}`,
          type: "assignment",
          title: file.name,
          startAt: file.dueDate,
          endAt: undefined,
          description: file.instructions || "Assignment due",
        })),
      ...quizzes
        .filter((quiz: any) => quiz.dueDate)
        .map((quiz: any) => ({
          id: `quiz-${quiz._id}`,
          type: "quiz",
          title: quiz.title,
          startAt: quiz.dueDate,
          endAt: undefined,
          description: "Quiz due",
        })),
      ...forms
        .filter((form: any) => form.isOpen)
        .map((form: any) => ({
          id: `form-${form._id}`,
          type: "form",
          title: form.title,
          startAt: form.createdAt,
          endAt: undefined,
          description: form.description || "Form available",
        })),
      ...custom.map((event: any) => ({
        id: `event-${event._id}`,
        type: event.eventType,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        description: event.description,
      })),
    ];

    return events
      .filter((event: any) => event.startAt >= start && event.startAt <= end)
      .sort((a: any, b: any) => a.startAt - b.startAt);
  },
});

export const getGamificationProfile = query({
  args: {
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, { classId }) => {
    const user = await requireUser(ctx as any);
    const db: any = ctx.db;

    const badges = await db
      .query("userBadges")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .collect();

    const badgeDefs = await db.query("badges").collect();
    const badgeMap = new Map(badgeDefs.map((badge: any) => [badge.code, badge]));

    const recentQuizzes = await db
      .query("quizSubmissions")
      .withIndex("student", (q: any) => q.eq("studentId", user.email))
      .collect();

    const streak = user.streak || 0;
    const level = user.level || Math.max(1, Math.floor((user.xp || 0) / 100) + 1);

    return {
      xp: user.xp || 0,
      streak,
      level,
      classId,
      badges: badges.map((entry: any) => ({
        ...entry,
        badge: badgeMap.get(entry.badgeCode) || null,
      })),
      quizCount: recentQuizzes.length,
    };
  },
});

export const awardBadge = mutation({
  args: {
    userEmail: v.string(),
    badgeCode: v.string(),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, { userEmail, badgeCode, classId }) => {
    const user = await requireUser(ctx);

    if (classId) {
      await assertTeacherOfClass(ctx, classId, user.email);
    } else if (user.email !== userEmail) {
      throw new Error("Only teachers can award badges to others");
    }

    const db: any = ctx.db;
    const badge = await db
      .query("badges")
      .withIndex("code", (q: any) => q.eq("code", badgeCode))
      .first();
    if (!badge) throw new Error("Badge not found");

    const existing = await db
      .query("userBadges")
      .withIndex("user", (q: any) => q.eq("userEmail", userEmail))
      .filter((q: any) => q.eq(q.field("badgeCode"), badgeCode))
      .first();

    if (existing) return existing;

    const id = await db.insert("userBadges", {
      userEmail,
      badgeCode,
      classId,
      awardedAt: Date.now(),
    });

    await createNotification(ctx, {
      userEmail,
      type: "announcement",
      title: "Badge Earned",
      body: `You earned the ${badge.title} badge!`,
      classId,
    });

    return await db.get(id);
  },
});

export const upsertIntegrationConnection = mutation({
  args: {
    provider: v.union(v.literal("google_classroom"), v.literal("google_drive"), v.literal("canvas")),
    status: v.union(v.literal("connected"), v.literal("disconnected")),
    externalId: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, { provider, status, externalId, metadata }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const existing = await db
      .query("integrationConnections")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .filter((q: any) => q.eq(q.field("provider"), provider))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        status,
        externalId,
        metadata,
        lastSyncAt: status === "connected" ? Date.now() : existing.lastSyncAt,
      });
      return await db.get(existing._id);
    }

    const id = await db.insert("integrationConnections", {
      userEmail: user.email,
      provider,
      status,
      externalId,
      metadata,
      lastSyncAt: status === "connected" ? Date.now() : undefined,
    });

    return await db.get(id);
  },
});

export const getIntegrationConnections = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any);

    return await (ctx.db as any)
      .query("integrationConnections")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .collect();
  },
});

export const triggerIntegrationSync = mutation({
  args: {
    provider: v.union(v.literal("google_classroom"), v.literal("google_drive"), v.literal("canvas")),
  },
  handler: async (ctx, { provider }) => {
    const user = await requireUser(ctx);
    const db: any = ctx.db;

    const connection = await db
      .query("integrationConnections")
      .withIndex("user", (q: any) => q.eq("userEmail", user.email))
      .filter((q: any) => q.eq(q.field("provider"), provider))
      .first();

    if (!connection || connection.status !== "connected") {
      throw new Error("Provider is not connected");
    }

    await db.patch(connection._id, {
      lastSyncAt: Date.now(),
    });

    return {
      provider,
      syncedAt: Date.now(),
      status: "ok",
      message: "Sync queued (placeholder implementation).",
    };
  },
});

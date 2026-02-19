import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("student"), v.literal("teacher"))),
    accentColor: v.optional(
      v.union(
        v.literal("green"),
        v.literal("teal"),
        v.literal("blue"),
        v.literal("indigo"),
        v.literal("amber"),
        v.literal("pink"),
        v.literal("rose"),
        v.literal("orange"),
      ),
    ),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    xp: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    level: v.optional(v.number()),
  }).index("email", ["email"]).index("xp", ["xp"]),

  classes: defineTable({
    name: v.string(),
    code: v.string(),
    teacherId: v.string(),
    description: v.optional(v.string()),
    bannerStorageId: v.optional(v.id("_storage")),
    archived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    term: v.optional(v.string()),
    section: v.optional(v.string()),
  }).index("code", ["code"]).index("teacher", ["teacherId"]),

  classMembers: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    joinedAt: v.number(),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  files: defineTable({
    name: v.string(),
    type: v.string(),
    mimeType: v.string(),
    size: v.number(),
    uploadedBy: v.string(),
    classId: v.id("classes"),
    storageId: v.id("_storage"),
    editable: v.boolean(),
    isAssignment: v.boolean(),
    dueDate: v.optional(v.number()),
    instructions: v.optional(v.string()),
    questionPrompts: v.optional(v.array(v.string())),
    outcomeIds: v.optional(v.array(v.id("outcomes"))),
    latePolicy: v.optional(v.union(v.literal("allow"), v.literal("penalty"), v.literal("block"))),
    maxResubmissions: v.optional(v.number()),
    rubric: v.optional(v.array(v.object({
      criterion: v.string(),
      maxPoints: v.number(),
    }))),
    allowComments: v.optional(v.boolean()),
  }).index("class", ["classId"]),

  submissions: defineTable({
    assignmentId: v.id("files"),
    studentId: v.string(),
    classId: v.id("classes"),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileMimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    linkUrl: v.optional(v.string()),
    content: v.optional(v.string()),
    submittedAt: v.number(),
    score: v.optional(v.number()),
    feedback: v.optional(v.string()),
    rubricScores: v.optional(v.array(v.object({
      criterion: v.string(),
      points: v.number(),
    }))),
    gradedAt: v.optional(v.number()),
    gradedBy: v.optional(v.string()),
    isLate: v.optional(v.boolean()),
  }).index("assignment", ["assignmentId"]).index("student", ["studentId"]),

  lessons: defineTable({
    classId: v.optional(v.id("classes")),
    unitId: v.optional(v.id("units")),
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
    prerequisiteLessonIds: v.optional(v.array(v.id("lessons"))),
    masteryThreshold: v.optional(v.number()),
  }).index("class", ["classId"]).index("order", ["order"]),

  userProgress: defineTable({
    userId: v.string(), // email or user lookup
    classId: v.optional(v.id("classes")),
    lessonId: v.id("lessons"),
    completedAt: v.number(),
  }).index("user", ["userId"]).index("lesson", ["lessonId"]).index("class", ["classId"]),

  userClassStats: defineTable({
    classId: v.id("classes"),
    userEmail: v.string(),
    xp: v.number(),
    streak: v.number(),
    lastActiveAt: v.optional(v.number()),
    level: v.number(),
  }).index("class", ["classId"]).index("user", ["userEmail"]).index("class_user", ["classId", "userEmail"]),

  announcements: defineTable({
    classId: v.id("classes"),
    content: v.string(),
    authorEmail: v.string(),
    pinned: v.optional(v.boolean()),
    scheduledFor: v.optional(v.number()),
    editedAt: v.optional(v.number()),
    editHistory: v.optional(v.array(v.object({
      content: v.string(),
      editedAt: v.number(),
      editedBy: v.string(),
    }))),
  }).index("class", ["classId"]),

  links: defineTable({
    classId: v.id("classes"),
    title: v.string(),
    url: v.string(),
    createdBy: v.string(),
    isWhiteboard: v.optional(v.boolean()),
  }).index("class", ["classId"]),

  exams: defineTable({
    classId: v.id("classes"),
    name: v.string(),
    createdBy: v.string(),
    isVisibleToStudents: v.boolean(),
  }).index("class", ["classId"]),

  grades: defineTable({
    classId: v.id("classes"),
    examId: v.id("exams"),
    studentId: v.string(), // email
    score: v.optional(v.number()),
    letterGrade: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("class", ["classId"])
    .index("exam", ["examId"])
    .index("student", ["studentId"]),

  quizzes: defineTable({
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
    authorEmail: v.string(),
    xpValue: v.number(),
    xpPerQuestion: v.optional(v.number()),       // XP per question (overrides xpValue if set)
    timeLimitMinutes: v.optional(v.number()),    // Optional homework timer
    gradesPublic: v.optional(v.boolean()),       // Teacher decides grade visibility
    singleAttempt: v.optional(v.boolean()),      // Student can only attempt once
    dueDate: v.optional(v.number()),             // Due date for homework tracking
    randomizeQuestions: v.optional(v.boolean()),
    randomizeOptions: v.optional(v.boolean()),
    maxAttempts: v.optional(v.number()),
    showExplanations: v.optional(v.boolean()),
  }).index("class", ["classId"]),

  quizSubmissions: defineTable({
    quizId: v.id("quizzes"),
    studentId: v.string(), // email
    score: v.number(),
    totalQuestions: v.number(),
    completedAt: v.number(),
    attemptNumber: v.optional(v.number()),
  }).index("quiz", ["quizId"]).index("student", ["studentId"]),

  outcomes: defineTable({
    classId: v.id("classes"),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  }).index("class", ["classId"]),

  reflections: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    mood: v.string(),
    goal: v.string(),
    blocker: v.string(),
    createdAt: v.number(),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  attendanceRecords: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("tardy")),
    date: v.number(),
    recordedBy: v.string(),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  interventions: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    note: v.string(),
    level: v.union(v.literal("note"), v.literal("concern"), v.literal("action")),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  nudges: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    assignmentId: v.id("files"),
    message: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("sent"), v.literal("acknowledged")),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  forms: defineTable({
    classId: v.id("classes"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("survey"), v.literal("permission"), v.literal("field_trip")),
    createdBy: v.string(),
    isOpen: v.boolean(),
    questions: v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.union(v.literal("short"), v.literal("long"), v.literal("single"), v.literal("multi")),
      options: v.optional(v.array(v.string())),
      required: v.optional(v.boolean()),
    })),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    enforceOneResponse: v.optional(v.boolean()),
  }).index("class", ["classId"]),

  classInvites: defineTable({
    classId: v.id("classes"),
    code: v.string(),
    createdBy: v.string(),
    expiresAt: v.number(),
    maxUses: v.optional(v.number()),
    uses: v.number(),
    isActive: v.boolean(),
  }).index("class", ["classId"]).index("code", ["code"]),

  joinRequests: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
  }).index("class", ["classId"]).index("student", ["studentId"]),

  streamComments: defineTable({
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
    authorEmail: v.string(),
    content: v.string(),
    createdAt: v.number(),
    parentId: v.optional(v.id("streamComments")),
  }).index("entry", ["entryType", "entryId"]).index("class", ["classId"]),

  streamReactions: defineTable({
    classId: v.id("classes"),
    entryType: v.string(),
    entryId: v.string(),
    userEmail: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  }).index("entry", ["entryType", "entryId"]).index("user", ["userEmail"]),

  notificationPrefs: defineTable({
    userEmail: v.string(),
    classAnnouncements: v.boolean(),
    gradeUpdates: v.boolean(),
    weeklySummary: v.boolean(),
    directMessages: v.boolean(),
    dueReminders: v.boolean(),
  }).index("user", ["userEmail"]),

  notifications: defineTable({
    userEmail: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    classId: v.optional(v.id("classes")),
    link: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("user", ["userEmail"]).index("class", ["classId"]),

  directMessages: defineTable({
    classId: v.id("classes"),
    senderEmail: v.string(),
    recipientEmail: v.string(),
    content: v.string(),
    createdAt: v.number(),
    parentId: v.optional(v.id("directMessages")),
    editedAt: v.optional(v.number()),
    isFlagged: v.optional(v.boolean()),
  }).index("class", ["classId"]).index("recipient", ["recipientEmail"]).index("sender", ["senderEmail"]),

  messageAudit: defineTable({
    messageId: v.id("directMessages"),
    action: v.string(),
    actorEmail: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("message", ["messageId"]),

  fileComments: defineTable({
    fileId: v.id("files"),
    classId: v.id("classes"),
    authorEmail: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("fileComments")),
    targetSubmissionId: v.optional(v.id("submissions")),
    createdAt: v.number(),
  }).index("file", ["fileId"]).index("class", ["classId"]),

  assignmentExtensions: defineTable({
    assignmentId: v.id("files"),
    classId: v.id("classes"),
    studentId: v.string(),
    extendedDueDate: v.number(),
    reason: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("assignment", ["assignmentId"]).index("student", ["studentId"]),

  gradebookPolicies: defineTable({
    classId: v.id("classes"),
    categories: v.array(v.object({
      name: v.string(),
      weight: v.number(),
      dropLowest: v.optional(v.boolean()),
    })),
    curvePoints: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("class", ["classId"]),

  interventionTasks: defineTable({
    classId: v.id("classes"),
    studentId: v.string(),
    noteId: v.optional(v.id("interventions")),
    assignedTo: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
    dueAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("class", ["classId"]).index("student", ["studentId"]).index("assignedTo", ["assignedTo"]),

  calendarEvents: defineTable({
    classId: v.id("classes"),
    eventType: v.string(),
    eventId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    createdBy: v.string(),
  }).index("class", ["classId"]).index("startAt", ["startAt"]),

  badges: defineTable({
    code: v.string(),
    title: v.string(),
    description: v.string(),
    xpThreshold: v.optional(v.number()),
    streakThreshold: v.optional(v.number()),
  }).index("code", ["code"]),

  userBadges: defineTable({
    userEmail: v.string(),
    badgeCode: v.string(),
    classId: v.optional(v.id("classes")),
    awardedAt: v.number(),
  }).index("user", ["userEmail"]).index("badge", ["badgeCode"]),

  integrationConnections: defineTable({
    userEmail: v.string(),
    provider: v.union(v.literal("google_classroom"), v.literal("google_drive"), v.literal("canvas")),
    status: v.union(v.literal("connected"), v.literal("disconnected")),
    externalId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  }).index("user", ["userEmail"]).index("provider", ["provider"]),

  formResponses: defineTable({
    formId: v.id("forms"),
    classId: v.id("classes"),
    studentId: v.string(),
    answers: v.array(v.object({
      questionId: v.string(),
      value: v.string(),
    })),
    submittedAt: v.number(),
  }).index("form", ["formId"]).index("student", ["studentId"]).index("class", ["classId"]),
});

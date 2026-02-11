import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("student"), v.literal("teacher"))),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    xp: v.optional(v.number()),
  }).index("email", ["email"]).index("xp", ["xp"]),

  classes: defineTable({
    name: v.string(),
    code: v.string(),
    teacherId: v.string(),
    description: v.optional(v.string()),
    bannerStorageId: v.optional(v.id("_storage")),
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
    outcomeIds: v.optional(v.array(v.id("outcomes"))),
  }).index("class", ["classId"]),

  submissions: defineTable({
    assignmentId: v.id("files"),
    studentId: v.string(),
    classId: v.id("classes"),
    storageId: v.optional(v.id("_storage")),
    content: v.optional(v.string()),
    submittedAt: v.number(),
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
  }).index("class", ["classId"]).index("order", ["order"]),

  userProgress: defineTable({
    userId: v.string(), // email or user lookup
    lessonId: v.id("lessons"),
    completedAt: v.number(),
  }).index("user", ["userId"]).index("lesson", ["lessonId"]),

  announcements: defineTable({
    classId: v.id("classes"),
    content: v.string(),
    authorEmail: v.string(),
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
    })),
    authorEmail: v.string(),
    xpValue: v.number(),
    xpPerQuestion: v.optional(v.number()),       // XP per question (overrides xpValue if set)
    timeLimitMinutes: v.optional(v.number()),    // Optional homework timer
    gradesPublic: v.optional(v.boolean()),       // Teacher decides grade visibility
    singleAttempt: v.optional(v.boolean()),      // Student can only attempt once
    dueDate: v.optional(v.number()),             // Due date for homework tracking
  }).index("class", ["classId"]),

  quizSubmissions: defineTable({
    quizId: v.id("quizzes"),
    studentId: v.string(), // email
    score: v.number(),
    totalQuestions: v.number(),
    completedAt: v.number(),
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
  }).index("class", ["classId"]),

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

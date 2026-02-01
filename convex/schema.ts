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
  }).index("email", ["email"]),

  classes: defineTable({
    name: v.string(),
    code: v.string(),
    teacherId: v.string(),
    description: v.optional(v.string()),
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
  }).index("class", ["classId"]),

  submissions: defineTable({
    assignmentId: v.id("files"),
    studentId: v.string(),
    classId: v.id("classes"),
    storageId: v.optional(v.id("_storage")),
    content: v.optional(v.string()),
    submittedAt: v.number(),
  }).index("assignment", ["assignmentId"]).index("student", ["studentId"]),
});

import { z } from "zod";

const cloudinarySecureUrlSchema = z
  .string()
  .url({ message: "Must be a valid URL!" })
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  }, { message: "File must be uploaded through Cloudinary." });

const optionalCloudinarySecureUrlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  }, { message: "File must be uploaded through Cloudinary." });

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Hall name is required!" }),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  programId: z.coerce.number().min(1, { message: "Program is required!" }).optional(),
  semester: z.string().min(1, { message: "Semester is required!" }),
  // parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  pdfUrl: cloudinarySecureUrlSchema,
  courseId: z.coerce.number({ message: "Course is required!" }),
  maxSubmissions: z.coerce.number().min(1).optional(),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().optional().or(z.literal("")),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  courseId: z.coerce.number({ message: "Course is required!" }),
  teacherId: z.string().optional(),
  pdfUrl: optionalCloudinarySecureUrlSchema,
  videoUrl: optionalCloudinarySecureUrlSchema,
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  pdfUrl: cloudinarySecureUrlSchema,
  courseId: z.coerce.number({ message: "Course is required!" }),
  maxSubmissions: z.coerce.number().min(1).optional(),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const eventSchema = z
  .object({
    id: z.coerce.number().optional(),
    title: z.string().min(1, { message: "Event name is required!" }),
    description: z.string().optional().or(z.literal("")),
    startTime: z.coerce.date({ message: "Start time is required!" }),
    endTime: z.coerce.date({ message: "End time is required!" }),
    recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"], {
      message: "Repetition frequency is required!",
    }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type EventSchema = z.infer<typeof eventSchema>;

export const updateDeadlineSchema = z.object({
  id: z.coerce.number(),
  type: z.enum(["assignment", "exam"]),
  deadline: z.coerce.date({ message: "Deadline is required!" }),
});

export type UpdateDeadlineSchema = z.infer<typeof updateDeadlineSchema>;

export const programSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Program name is required!" }),
  semester: z.string().min(1, { message: "Semester is required!" }),
  description: z.string().optional().or(z.literal("")),
});

export type ProgramSchema = z.infer<typeof programSchema>;

export const courseSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Course name is required!" }),
  description: z.string().optional().or(z.literal("")),
  programId: z.coerce.number().min(1, { message: "Program is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const bulkProgramSemesterSchema = z.object({
  semester: z.string().min(1, { message: "Semester is required!" }),
});

export type BulkProgramSemesterSchema = z.infer<
  typeof bulkProgramSemesterSchema
>;

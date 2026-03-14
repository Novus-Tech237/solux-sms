"use server";

import { revalidatePath } from "next/cache";
import {
  AssignmentSchema,
  ClassSchema,
  EventSchema,
  ExamSchema,
  LessonSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  UpdateDeadlineSchema,
  ProgramSchema,
  CourseSchema,
  BulkProgramSemesterSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean; message?: string };

const isCloudinaryUrl = (value?: string | null) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};

const isOptionalCloudinaryUrl = (value?: string | null) => {
  if (!value) return true;
  return isCloudinaryUrl(value);
};

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data: {
        name: data.name,
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    // Generate a temporary password if none provided
    const password = data.password && data.password !== "" 
      ? data.password 
      : Math.random().toString(36).slice(-12);
    
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType || null,
        sex: data.sex,
        birthday: data.birthday || null,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType as string,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const createUserPayload: any = {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
      password: data.password,
      publicMetadata: { role: "student" },
    };

    const user = await clerkClient.users.createUser(createUserPayload);

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        semester: data.semester,
      },
    });

    // Create student enrollment in program if programId is provided
    if (data.programId) {
      await prisma.studentEnrollment.create({
        data: {
          studentId: user.id,
          programId: data.programId,
          status: "ACTIVE",
        },
      });
    }

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        sex: data.sex,
        birthday: data.birthday,
        semester: data.semester,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl)) {
      return { success: false, error: true };
    }

    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        pdfUrl: data.pdfUrl,
        courseId: data.courseId,
        maxSubmissions: data.maxSubmissions,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl)) {
      return { success: false, error: true };
    }

    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        pdfUrl: data.pdfUrl,
        courseId: data.courseId,
        maxSubmissions: data.maxSubmissions,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

const verifyTeacherCourseAccess = async (teacherId: string, courseId: number) => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      teacherId,
    },
    select: { id: true },
  });

  return Boolean(course);
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl) || !isOptionalCloudinaryUrl(data.videoUrl)) {
      return { success: false, error: true };
    }

    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    const teacherId = role === "teacher" ? userId! : data.teacherId;

    if (!teacherId) {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const assignedCourse = await prisma.course.findFirst({
        where: {
          id: data.courseId,
          teacherId: userId!,
        },
        select: { id: true },
      });

      if (!assignedCourse) {
        return { success: false, error: true };
      }
    }

    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        pdfUrl: data.pdfUrl,
        videoUrl: data.videoUrl || null,
        courseId: data.courseId,
        teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl) || !isOptionalCloudinaryUrl(data.videoUrl)) {
      return { success: false, error: true };
    }

    if (!data.id) {
      return { success: false, error: true };
    }

    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const canAccess = await verifyTeacherCourseAccess(userId!, data.id);
      if (!canAccess) {
        return { success: false, error: true };
      }
    }

    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        pdfUrl: data.pdfUrl,
        videoUrl: data.videoUrl || null,
        courseId: data.courseId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = Number(data.get("id"));
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const canAccess = await verifyTeacherCourseAccess(userId!, id);
      if (!canAccess) {
        return { success: false, error: true };
      }
    }

    await prisma.lesson.delete({ where: { id } });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl)) {
      return { success: false, error: true };
    }

    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const canAccess = await verifyTeacherCourseAccess(userId!, data.courseId);
      if (!canAccess) {
        return { success: false, error: true };
      }
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        pdfUrl: data.pdfUrl,
        courseId: data.courseId,
        maxSubmissions: data.maxSubmissions,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!isCloudinaryUrl(data.pdfUrl)) {
      return { success: false, error: true };
    }

    if (!data.id) {
      return { success: false, error: true };
    }

    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const assignment = await prisma.assignment.findFirst({
        where: { id: data.id, course: { teacherId: userId! } },
        select: { id: true },
      });

      if (!assignment) {
        return { success: false, error: true };
      }
    }

    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        pdfUrl: data.pdfUrl,
        courseId: data.courseId,
        maxSubmissions: data.maxSubmissions,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = Number(data.get("id"));
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher") {
      const assignment = await prisma.assignment.findFirst({
        where: { id, lesson: { teacherId: userId! } },
        select: { id: true },
      });

      if (!assignment) {
        return { success: false, error: true };
      }
    }

    await prisma.assignment.delete({ where: { id } });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role !== "admin") {
      return { success: false, error: true };
    }

    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || "No description",
        startTime: data.startTime,
        endTime: data.endTime,
        recurrence: data.recurrence,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (!data.id || role !== "admin") {
      return { success: false, error: true };
    }

    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || "No description",
        startTime: data.startTime,
        endTime: data.endTime,
        recurrence: data.recurrence,
        classId: null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = Number(data.get("id"));
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role !== "admin") {
      return { success: false, error: true };
    }

    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateWorkDeadline = async (
  currentState: CurrentState,
  data: UpdateDeadlineSchema
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role !== "admin" && role !== "teacher") {
      return { success: false, error: true };
    }

    if (data.type === "assignment") {
      if (role === "teacher") {
        const assignment = await prisma.assignment.findFirst({
          where: { id: data.id, lesson: { teacherId: userId! } },
          select: { id: true },
        });
        if (!assignment) {
          return { success: false, error: true };
        }
      }

      await prisma.assignment.update({
        where: { id: data.id },
        data: { dueDate: data.deadline },
      });
    } else {
      if (role === "teacher") {
        const exam = await prisma.exam.findFirst({
          where: { id: data.id, lesson: { teacherId: userId! } },
          select: { id: true },
        });
        if (!exam) {
          return { success: false, error: true };
        }
      }

      await prisma.exam.update({
        where: { id: data.id },
        data: { endTime: data.deadline },
      });
    }

    revalidatePath("/teacher/content");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Enrollment Actions
export const enrollInProgram = async (programId: number) => {
  const { userId } = auth();

  try {
    if (!userId) {
      return { success: false, error: true };
    }

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true },
    });

    if (!program) {
      return { success: false, error: true };
    }

    const activeEnrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        programId: true,
      },
    });

    if (activeEnrollment?.programId === programId) {
      return { success: true, error: false };
    }

    await prisma.$transaction(async (tx) => {
      if (activeEnrollment) {
        await tx.studentEnrollment.update({
          where: { id: activeEnrollment.id },
          data: { status: "UNENROLLED" },
        });
      }

      // Course registrations are scoped to the active program, so reset them when changing programs.
      await tx.studentCourseRegistration.deleteMany({
        where: { studentId: userId },
      });

      await tx.studentEnrollment.upsert({
        where: {
          studentId_programId: {
            studentId: userId,
            programId,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          studentId: userId,
          programId,
          status: "ACTIVE",
        },
      });
    });

    revalidatePath("/student");
    revalidatePath("/student/available-courses");
    revalidatePath("/list");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const unenrollFromProgram = async (programId: number) => {
  const { userId } = auth();

  try {
    if (!userId) {
      return { success: false, error: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.studentEnrollment.update({
        where: {
          studentId_programId: {
            studentId: userId,
            programId,
          },
        },
        data: {
          status: "UNENROLLED",
        },
      });

      await tx.studentCourseRegistration.deleteMany({
        where: { studentId: userId },
      });
    });

    revalidatePath("/student");
    revalidatePath("/student/available-courses");
    revalidatePath("/list");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const getAvailablePrograms = async () => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        courses: {
          include: {
            teacher: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return programs;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getStudentEnrolledProgram = async () => {
  const { userId } = auth();

  try {
    if (!userId) {
      return null;
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        status: "ACTIVE",
      },
      include: {
        program: {
          include: {
            courses: {
              include: {
                lessons: {
                  include: {
                    teacher: {
                      select: {
                        name: true,
                        surname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return enrollment?.program || null;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getStudentProgramCoursesForRegistration = async () => {
  const { userId } = auth();

  try {
    if (!userId) {
      return null;
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        status: "ACTIVE",
      },
      include: {
        program: {
          include: {
            courses: {
              include: {
                teacher: {
                  select: {
                    name: true,
                    surname: true,
                  },
                },
              },
              orderBy: {
                name: "asc",
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return null;
    }

    const registrations = await prisma.studentCourseRegistration.findMany({
      where: {
        studentId: userId,
        course: {
          programId: enrollment.programId,
        },
      },
      select: {
        courseId: true,
      },
    });

    return {
      program: enrollment.program,
      registeredCourseIds: registrations.map((registration) =>
        registration.courseId
      ),
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const registerStudentCourse = async (courseId: number) => {
  const { userId } = auth();

  try {
    if (!userId) {
      return { success: false, error: true };
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        status: "ACTIVE",
      },
      select: {
        programId: true,
      },
    });

    if (!enrollment) {
      return { success: false, error: true, message: "Enroll in a program first." };
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        programId: enrollment.programId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      return { success: false, error: true, message: "Course is not in your program." };
    }

    await prisma.studentCourseRegistration.upsert({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId,
        },
      },
      update: {},
      create: {
        studentId: userId,
        courseId,
      },
    });

    revalidatePath("/student");
    revalidatePath("/student/available-courses");
    revalidatePath("/list/lessons");
    revalidatePath("/list/exams");
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const unregisterStudentCourse = async (courseId: number) => {
  const { userId } = auth();

  try {
    if (!userId) {
      return { success: false, error: true };
    }

    await prisma.studentCourseRegistration.deleteMany({
      where: {
        studentId: userId,
        courseId,
      },
    });

    revalidatePath("/student");
    revalidatePath("/student/available-courses");
    revalidatePath("/list/lessons");
    revalidatePath("/list/exams");
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createProgram = async (
  currentState: CurrentState,
  data: ProgramSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.program.create({
      data: {
        name: data.name,
        semester: data.semester,
        description: data.description || null,
      },
    });

    revalidatePath("/admin/programs");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateProgram = async (
  currentState: CurrentState,
  data: ProgramSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.program.update({
      where: { id: data.id },
      data: {
        name: data.name,
        semester: data.semester,
        description: data.description || null,
      },
    });

    revalidatePath("/admin/programs");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteProgram = async (
  currentState: CurrentState,
  data: FormData
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  const id = Number(data.get("id"));

  try {
    await prisma.program.delete({ where: { id } });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAllProgramSemesters = async (
  currentState: CurrentState,
  data: BulkProgramSemesterSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true, message: "Unauthorized" };
  }

  try {
    const programs = await prisma.program.findMany({
      select: { name: true },
    });

    const counts = new Map<string, number>();
    for (const program of programs) {
      counts.set(program.name, (counts.get(program.name) ?? 0) + 1);
    }

    const duplicateNames = Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name);

    if (duplicateNames.length > 0) {
      return {
        success: false,
        error: true,
        message:
          "Bulk update blocked because multiple programs share the same name. Update them individually first.",
      };
    }

    await prisma.program.updateMany({
      data: {
        semester: data.semester,
      },
    });

    revalidatePath("/list/programs");
    revalidatePath("/admin/programs");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: "Failed to update all program semesters",
    };
  }
};

export const createCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.course.create({
      data: {
        name: data.name,
        description: data.description || null,
        teacherId: data.teacherId,
        programId: data.programId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.course.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteCourse = async (
  currentState: CurrentState,
  data: FormData
) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  const id = Number(data.get("id"));

  try {
    await prisma.course.delete({ where: { id } });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Add/replace these two functions in your @/lib/actions file

export async function releaseAssignmentGrades(assessmentId: number, courseId: number) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "teacher") return { success: false, message: "Unauthorized" };

    await prisma.assignment.update({
      where: { id: assessmentId, courseId, course: { teacherId: userId! } },
      data: { gradesReleased: true },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to release grades" };
  }
}

// export async function releaseExamGrades(assessmentId: number, courseId: number) {
//   try {
//     const { userId, sessionClaims } = auth();
//     const role = (sessionClaims?.metadata as { role?: string })?.role;
//     if (role !== "teacher") return { success: false, message: "Unauthorized" };

//     await prisma.exam.update({
//       where: { id: assessmentId, courseId, course: { teacherId: userId! } },
//       data: { gradesReleased: true },
//     });

//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { success: false, message: "Failed to release grades" };
//   }
// }

// Add/replace these two functions in your @/lib/actions file


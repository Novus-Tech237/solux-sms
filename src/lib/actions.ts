"use server";

import { revalidatePath } from "next/cache";
import {
  AssignmentSchema,
  ClassSchema,
  ExamSchema,
  LessonSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  UpdateDeadlineSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

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
      data,
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
      data,
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
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
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
        bloodType: data.bloodType as string,
        sex: data.sex,
        birthday: data.birthday,
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
      publicMetadata: { role: "student" },
    };
    if (data.password && data.password !== "") {
      createUserPayload.password = data.password;
    }

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
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        semester: data.semester,
        ...(data.gradeId ? { gradeId: data.gradeId } : {}),
        ...(data.classId ? { classId: data.classId } : {}),
      },
    });

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
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        semester: data.semester,
        ...(data.gradeId ? { gradeId: data.gradeId } : {}),
        ...(data.classId ? { classId: data.classId } : {}),
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
        lessonId: data.lessonId,
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
        lessonId: data.lessonId,
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

const verifyTeacherLessonAccess = async (teacherId: string, lessonId: number) => {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      teacherId,
    },
    select: { id: true },
  });

  return Boolean(lesson);
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
      const assignedSubject = await prisma.teacher.findFirst({
        where: {
          id: userId!,
          subjects: {
            some: { id: data.subjectId },
          },
        },
        select: { id: true },
      });

      if (!assignedSubject) {
        return { success: false, error: true };
      }

      const assignedClass = await prisma.class.findFirst({
        where: {
          id: data.classId,
          supervisorId: userId!,
        },
        select: { id: true },
      });

      if (!assignedClass) {
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
        subjectId: data.subjectId,
        classId: data.classId,
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
      const canAccess = await verifyTeacherLessonAccess(userId!, data.id);
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
        subjectId: data.subjectId,
        classId: data.classId,
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
      const canAccess = await verifyTeacherLessonAccess(userId!, id);
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
      const canAccess = await verifyTeacherLessonAccess(userId!, data.lessonId);
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
        lessonId: data.lessonId,
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
        where: { id: data.id, lesson: { teacherId: userId! } },
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
        lessonId: data.lessonId,
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

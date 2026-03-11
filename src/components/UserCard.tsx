import prisma from "@/lib/prisma";
import UserCardClient from "./UserCardClient";

const UserCard = async ({ type }: { type: "admin" | "teacher" | "student" }) => {
  const modelMap: Record<string, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
  };

  const data = await modelMap[type].count();

  return <UserCardClient type={type} count={data} />;
};

export default UserCard;

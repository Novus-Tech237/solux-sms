import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminData = [
    {
      id: "user_3ALr96iaMgZjdNrnowfA4bsNOW7",
      username: "Default"
    }
  ];

  for (const admin of adminData) {
    await prisma.admin.upsert({
      where: { id: admin.id },
      update: {},
      create: admin,
    });
  }

  const studentData = [
    {
      id: "user_3AvfiaIU9EIpYBCpnjYInzSaUAz",
      username: "SLXU20212332",
      name: "Yvan",
      surname: "Marshal",
      email: "yvanmarshal@mail.com",
      phone: "677885541",
      address: "Mvan",
      img: null,
      bloodType: null,
      sex: "MALE" as const,
      birthday: new Date("2000-04-08"),
      semester:"Fall 2026" // Default birthday since null in data
    }
  ];

  for (const student of studentData) {
    await prisma.student.upsert({
      where: { id: student.id },
      update: {},
      create: student,
    });
  }


  console.log('Admin user seeded successfully');

  // Seed students
  const teacherData = [
    {
      id: "user_3AveLEAIwUksUCyfuDFbM0HLruL",
      username: "ICTU20212332",
      name: "Richard",
      surname: "Evina",
      email: "malikachidi@gmail.com",
      phone: "677889955",
      address: "Mvan",
      img: null,
      bloodType: null,
      sex: "MALE" as const,
      birthday: new Date("2000-01-01"), // Default birthday since null in data
      semester: "2021-2022" // Default semester
    },
    {
      id: "user_3AvfKxx3jSRn5D8tOyQk5JDRWCr",
      username: "ICTU20212333",
      name: "Grace",
      surname: "Evina",
      email: "malikachidi9@gmail.com",
      phone: "699554478",
      address: "Logpom",
      img: null,
      bloodType: null,
      sex: "FEMALE" as const,
      birthday: new Date("2000-01-01"), // Default birthday
      semester: "2021-2022" // Default semester
    },
    {
      id: "user_3AvfWhR3ZCoobJKXTIqljApllIH",
      username: "ICTU20212334",
      name: "Chelsea",
      surname: "Nyuykong",
      email: "chelseam@gmail.com",
      phone: "65588479",
      address: "Messassi",
      img: null,
      bloodType: null,
      sex: "FEMALE" as const,
      birthday: new Date("2000-01-01"), // Default birthday
      semester: "2021-2022" // Default semester
    }
  ];

  for (const teacher of teacherData) {
    await prisma.teacher.upsert({
      where: { id: teacher.id },
      update: {},
      create: teacher,
    });
  }

  console.log('Teachers seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

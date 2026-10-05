import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding database...");

  // Settings
  await prisma.schoolSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      schoolName: "Greenfield High School",
      address: "Plot 12, Kampala Road",
      phone: "+256 700 000 000",
      email: "info@greenfield.sch",
      academicYear: "2026",
      currentTerm: "Term 2",
    },
  });

  const password = await hash("password123");

  // Users for every role (demo credentials)
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@school.com" },
    update: {},
    create: { name: "Alex Muwanga", email: "superadmin@school.com", password, role: "SUPER_ADMIN" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: { name: "Grace Nakato", email: "admin@school.com", password, role: "ADMIN" },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@school.com" },
    update: {},
    create: { name: "Peter Okello", email: "accountant@school.com", password, role: "ACCOUNTANT" },
  });

  const librarian = await prisma.user.upsert({
    where: { email: "librarian@school.com" },
    update: {},
    create: { name: "Sarah Achieng", email: "librarian@school.com", password, role: "LIBRARIAN" },
  });

  const warden = await prisma.user.upsert({
    where: { email: "warden@school.com" },
    update: {},
    create: { name: "James Okwir", email: "warden@school.com", password, role: "HOSTEL_WARDEN" },
  });

  const nurse = await prisma.user.upsert({
    where: { email: "nurse@school.com" },
    update: {},
    create: { name: "Nurse Betty", email: "nurse@school.com", password, role: "NURSE" },
  });

  const security = await prisma.user.upsert({
    where: { email: "security@school.com" },
    update: {},
    create: { name: "Guard Tom", email: "security@school.com", password, role: "SECURITY" },
  });

  const teacherUser1 = await prisma.user.upsert({
    where: { email: "teacher@school.com" },
    update: {},
    create: { name: "Moses Kato", email: "teacher@school.com", password, role: "TEACHER" },
  });
  const teacherUser2 = await prisma.user.upsert({
    where: { email: "teacher2@school.com" },
    update: {},
    create: { name: "Esther Namuli", email: "teacher2@school.com", password, role: "TEACHER" },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: "parent@school.com" },
    update: {},
    create: { name: "Robert Ssemwogerere", email: "parent@school.com", password, role: "PARENT" },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@school.com" },
    update: {},
    create: { name: "Daniel Ssemwogerere", email: "student@school.com", password, role: "STUDENT" },
  });

  // Classes & Streams
  const classNames = ["Senior One", "Senior Two", "Senior Three"];
  const classes = [];
  for (let i = 0; i < classNames.length; i++) {
    const c = await prisma.schoolClass.upsert({
      where: { name: classNames[i] },
      update: {},
      create: { name: classNames[i], order: i },
    });
    classes.push(c);
    for (const streamName of ["Blue", "Green", "Red"]) {
      await prisma.stream.upsert({
        where: { classId_name: { classId: c.id, name: streamName } },
        update: {},
        create: { classId: c.id, name: streamName },
      });
    }
  }
  const s1 = classes[0];
  const s1Blue = await prisma.stream.findFirst({ where: { classId: s1.id, name: "Blue" } });

  // Subjects
  const subjectData = [
    { name: "Mathematics", code: "MTH" },
    { name: "English", code: "ENG" },
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHE" },
    { name: "Biology", code: "BIO" },
    { name: "Geography", code: "GEO" },
  ];
  const subjects = [];
  for (const s of subjectData) {
    const sub = await prisma.subject.upsert({ where: { code: s.code }, update: {}, create: s });
    subjects.push(sub);
  }

  // Teacher profiles
  const teacher1 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: {
      userId: teacherUser1.id,
      employeeId: "EMP-1001",
      qualification: "BSc. Mathematics, PGDE",
      experience: "8 years",
      salary: 1500000,
    },
  });
  const teacher2 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: {
      userId: teacherUser2.id,
      employeeId: "EMP-1002",
      qualification: "BA Education, English Literature",
      experience: "5 years",
      salary: 1350000,
    },
  });

  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: teacher1.id, subjectId: subjects[0].id } },
    update: {},
    create: { teacherId: teacher1.id, subjectId: subjects[0].id },
  });
  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: teacher2.id, subjectId: subjects[1].id } },
    update: {},
    create: { teacherId: teacher2.id, subjectId: subjects[1].id },
  });

  if (s1Blue) {
    await prisma.stream.update({ where: { id: s1Blue.id }, data: { teacherId: teacher1.id } });
  }

  // Parent profile
  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id, occupation: "Engineer", relationship: "Father" },
  });

  // Student profile
  const student1 = await prisma.studentProfile.upsert({
    where: { admissionNumber: "ADM-2026-001" },
    update: {},
    create: {
      userId: studentUser.id,
      admissionNumber: "ADM-2026-001",
      firstName: "Daniel",
      lastName: "Ssemwogerere",
      gender: "Male",
      dateOfBirth: new Date("2011-03-15"),
      nationality: "Ugandan",
      bloodGroup: "O+",
      classId: s1.id,
      streamId: s1Blue?.id,
      parentId: parentProfile.id,
      category: "Day",
    },
  });

  // A few more students without login accounts (managed by admin)
  const extraStudents = [
    { adm: "ADM-2026-002", first: "Ivan", last: "Kirabo", gender: "Male" },
    { adm: "ADM-2026-003", first: "Faith", last: "Nabirye", gender: "Female" },
    { adm: "ADM-2026-004", first: "Brian", last: "Tumusiime", gender: "Male" },
  ];
  const createdExtras = [];
  for (const es of extraStudents) {
    const st = await prisma.studentProfile.upsert({
      where: { admissionNumber: es.adm },
      update: {},
      create: {
        admissionNumber: es.adm,
        firstName: es.first,
        lastName: es.last,
        gender: es.gender,
        dateOfBirth: new Date("2011-06-20"),
        nationality: "Ugandan",
        classId: s1.id,
        streamId: s1Blue?.id,
        category: "Day",
      },
    });
    createdExtras.push(st);
  }

  const allStudents = [student1, ...createdExtras];

  // Attendance (last 5 days)
  for (const st of allStudents) {
    for (let d = 0; d < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: st.id, date } },
        update: {},
        create: {
          studentId: st.id,
          date,
          status: d === 2 ? "Absent" : "Present",
          markedById: teacherUser1.id,
        },
      });
    }
  }

  // Exam + results
  const exam = await prisma.exam.create({
    data: {
      name: "Midterm Exam",
      type: "Midterm",
      academicYear: "2026",
      term: "Term 2",
      classId: s1.id,
    },
  });

  function gradeFor(marks: number) {
    if (marks >= 80) return "A";
    if (marks >= 70) return "B";
    if (marks >= 60) return "C";
    if (marks >= 50) return "D";
    return "F";
  }

  for (const st of allStudents) {
    for (const sub of subjects.slice(0, 4)) {
      const marks = Math.floor(Math.random() * 40) + 55;
      await prisma.examResult.upsert({
        where: { examId_studentId_subjectId: { examId: exam.id, studentId: st.id, subjectId: sub.id } },
        update: {},
        create: {
          examId: exam.id,
          studentId: st.id,
          subjectId: sub.id,
          marks,
          grade: gradeFor(marks),
        },
      });
    }
  }

  // Fee structure & payments
  await prisma.feeStructure.create({
    data: { classId: s1.id, term: "Term 2", academicYear: "2026", amount: 850000 },
  });
  await prisma.feePayment.create({
    data: {
      studentId: student1.id,
      amount: 500000,
      method: "Mobile Money",
      receiptNumber: "RCT-0001",
      term: "Term 2",
      academicYear: "2026",
    },
  });

  // Library
  const book1 = await prisma.book.upsert({
    where: { isbn: "978-0131103627" },
    update: {},
    create: { title: "The C Programming Language", author: "K&R", isbn: "978-0131103627", copies: 3, available: 2 },
  });
  await prisma.book.upsert({
    where: { isbn: "978-0439708180" },
    update: {},
    create: { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0439708180", copies: 5, available: 5 },
  });
  await prisma.bookLoan.create({
    data: {
      bookId: book1.id,
      studentId: student1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Hostel
  const room = await prisma.hostelRoom.upsert({
    where: { name: "Dorm A - Room 1" },
    update: {},
    create: { name: "Dorm A - Room 1", capacity: 4 },
  });
  await prisma.hostelAllocation.upsert({
    where: { studentId: createdExtras[0].id },
    update: {},
    create: { studentId: createdExtras[0].id, roomId: room.id },
  });

  // Transport
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: "UBA 123X" },
    update: {},
    create: { plateNumber: "UBA 123X", capacity: 33, driverName: "Mr. Kavuma" },
  });
  const route = await prisma.transportRoute.create({
    data: { name: "Route 1 - Ntinda", vehicleId: vehicle.id },
  });
  await prisma.transportAllocation.upsert({
    where: { studentId: createdExtras[1].id },
    update: {},
    create: { studentId: createdExtras[1].id, routeId: route.id },
  });

  // Inventory
  await prisma.inventoryItem.createMany({
    data: [
      { name: "Desktop Computer", category: "Computers", quantity: 40, condition: "Good", location: "Computer Lab" },
      { name: "Student Chairs", category: "Chairs", quantity: 500, condition: "Good", location: "Classrooms" },
      { name: "Microscopes", category: "Laboratory Equipment", quantity: 20, condition: "Fair", location: "Science Lab" },
    ],
  });

  // Payroll
  await prisma.payslip.create({
    data: {
      teacherId: teacher1.id,
      month: "June",
      year: "2026",
      basicSalary: 1500000,
      allowances: 200000,
      deductions: 150000,
      netSalary: 1550000,
    },
  });

  // Discipline
  await prisma.disciplineRecord.create({
    data: { studentId: createdExtras[2].id, type: "Warning", description: "Late to class three times this week." },
  });

  // Events
  await prisma.schoolEvent.createMany({
    data: [
      { title: "Inter-House Sports Gala", category: "Sports", date: new Date(Date.now() + 10 * 86400000), description: "Annual sports competition." },
      { title: "PTA General Meeting", category: "PTA Meetings", date: new Date(Date.now() + 20 * 86400000) },
    ],
  });

  // Assignments
  const assignment = await prisma.assignment.create({
    data: {
      title: "Algebra Worksheet Chapter 4",
      description: "Complete questions 1-20 and show your working.",
      subjectId: subjects[0].id,
      classId: s1.id,
      dueDate: new Date(Date.now() + 5 * 86400000),
    },
  });
  await prisma.assignmentSubmission.create({
    data: { assignmentId: assignment.id, studentId: student1.id, content: "Submitted via portal." },
  });

  // Learning resources
  await prisma.learningResource.createMany({
    data: [
      { title: "Algebra Basics - Video", type: "Videos", url: "https://example.com/algebra", subjectId: subjects[0].id },
      { title: "English Grammar Notes", type: "Notes", subjectId: subjects[1].id },
    ],
  });

  // Announcements
  await prisma.announcement.create({
    data: {
      title: "Term 2 Resumption",
      message: "All students are to report back to school on Monday for the start of Term 2.",
      targetRole: "ALL",
      createdById: admin.id,
    },
  });

  console.log("Seed complete.");
  console.log("---------------------------------------------");
  console.log("Demo login credentials (password for all: password123)");
  console.log("Super Admin:  superadmin@school.com");
  console.log("School Admin: admin@school.com");
  console.log("Teacher:      teacher@school.com");
  console.log("Student:      student@school.com");
  console.log("Parent:       parent@school.com");
  console.log("Accountant:   accountant@school.com");
  console.log("Librarian:    librarian@school.com");
  console.log("Hostel Warden:warden@school.com");
  console.log("Nurse:        nurse@school.com");
  console.log("Security:     security@school.com");
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

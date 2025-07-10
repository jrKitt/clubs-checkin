import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const students: {
      StudentID: string;
      StudentName: string;
      StudentYear: string;
      StudentMajor: string;
      StudentDes?: string;
    }[] = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "No students data" }, { status: 400 });
    }

    const batch = db.batch();
    students.forEach((student) => {
      const docRef = db.collection("student").doc(student.StudentID);
      batch.set(docRef, {
        StudentID: student.StudentID,
        StudentName: student.StudentName,
        StudentYear: student.StudentYear,
        StudentMajor: student.StudentMajor,
        StudentDes: student.StudentDes ?? "",
      });
    });

    await batch.commit();
    return NextResponse.json({ message: "Import success", count: students.length });
  } catch (error) {
    console.error("Import students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
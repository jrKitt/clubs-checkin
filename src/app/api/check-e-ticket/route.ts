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
    const body = await req.json();
    const { studentID, id, name, faculty, foodType, group, registeredAt, checkInStatus, foodNote } = body;

    if (studentID && !id && !name && !faculty && !foodType && !registeredAt) {
      // ตรวจสอบทั้ง club-etickets และ e-tickets
      let ticket = null;
      let snapshot = await db.collection("club-etickets").where("studentID", "==", studentID).limit(1).get();
      if (!snapshot.empty) {
        ticket = snapshot.docs[0].data();
      } else {
        // ลองค้นหาใน e-tickets ด้วย
        snapshot = await db.collection("e-tickets").where("studentID", "==", studentID).limit(1).get();
        if (!snapshot.empty) {
          ticket = snapshot.docs[0].data();
        }
      }
      if (!ticket) {
        return NextResponse.json({ allowRegister: true });
      }
      return NextResponse.json({ ticket });
    }

    if (id && typeof checkInStatus === "boolean") {
      const ticketRef = db.collection("e-tickets").doc(id);
      const ticketSnap = await ticketRef.get();
      if (!ticketSnap.exists) {
        return NextResponse.json({ error: "ไม่พบตั๋ว" }, { status: 404 });
      }
      await ticketRef.update({ checkInStatus });
      const updated = (await ticketRef.get()).data();
      return NextResponse.json({ message: "Check-in success", ticket: updated });
    }

    if (!id || !studentID || !name || !faculty || !foodType || !registeredAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticketRef = db.collection("e-tickets").doc(id);
    await ticketRef.set({
      id,
      studentID,
      name,
      faculty,
      foodType,
      foodNote: foodNote ?? "",
      group: group ?? "",
      registeredAt,
      checkInStatus: checkInStatus ?? false,
    });
    const ticket = (await ticketRef.get()).data();
    return NextResponse.json({ message: "Create success", ticket });
  } catch  {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("e-tickets").get();
    const tickets = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("E-Ticket GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
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
    const { id, studentID, name, faculty, foodType, group, registeredAt, checkInStatus, foodNote, point } = body;

    if (!id || !studentID || !name || !faculty || !foodType || !registeredAt) {
      if (id && typeof checkInStatus === "boolean") {
        const ticketRef = db.collection("club-etickets").doc(id);
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) {
          return NextResponse.json({ error: "ไม่พบตั๋ว" }, { status: 404 });
        }
        await ticketRef.update({ checkInStatus });
        const updated = (await ticketRef.get()).data();
        return NextResponse.json({ message: "Check-in success", ticket: updated });
      }
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticketRef = db.collection("club-etickets").doc(id);
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
      point: point ?? 0,
        });
    const ticket = (await ticketRef.get()).data();
    return NextResponse.json({ message: "Create success", ticket });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("club-etickets").get();
    const tickets = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Club E-Ticket GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, point } = body;

    if (!id || typeof point !== "number") {
      return NextResponse.json({ error: "Missing id or invalid point" }, { status: 400 });
    }

    const ticketRef = db.collection("club-etickets").doc(id);
    const ticketSnap = await ticketRef.get();
    
    if (!ticketSnap.exists) {
      return NextResponse.json({ error: "ไม่พบตั๋ว" }, { status: 404 });
    }

    await ticketRef.update({ point });
    const updated = (await ticketRef.get()).data();
    return NextResponse.json({ message: "Point updated", ticket: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
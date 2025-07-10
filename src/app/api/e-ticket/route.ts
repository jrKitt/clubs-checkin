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

    console.log("POST request body:", body);

    let finalStudentID = studentID;
    if (!finalStudentID) {
      if (body.customStudentID && typeof body.customStudentID === "string" && body.customStudentID.trim() !== "") {
        finalStudentID = body.customStudentID.trim();
      } else if (name && registeredAt) {
        finalStudentID =
          name.replace(/\s+/g, "").substring(0, 10) +
          "-" +
          (registeredAt + "").replace(/\D/g, "").slice(-6);
      } else {
        console.error("Missing required fields for generating studentID");
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    }

    if (!id || !name || !faculty || !foodType || !registeredAt) {
      if (id && typeof checkInStatus === "boolean") {
        const ticketRef = db.collection("club-etickets").doc(id);
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) {
          console.error("Ticket not found for ID:", id);
          return NextResponse.json({ error: "ไม่พบตั๋ว" }, { status: 404 });
        }
        await ticketRef.update({ checkInStatus });
        const updated = (await ticketRef.get()).data();
        console.log("Updated ticket:", updated);
        return NextResponse.json({ message: "Check-in success", ticket: updated });
      }
      console.error("Missing required fields for ticket creation");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticketRef = db.collection("club-etickets").doc(id);
    await ticketRef.set({
      id,
      studentID: finalStudentID,
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
    console.log("Created ticket:", ticket);
    return NextResponse.json({ message: "Create success", ticket });
  } catch (error) {
    console.error("POST API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("club-etickets").get();
    const tickets = snapshot.docs.map(doc => doc.data());
    // console.log("Fetched tickets:", tickets);
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

    console.log("PUT request body:", body);

    if (!id || typeof point !== "number") {
      console.error("Missing id or invalid point in PUT request");
      return NextResponse.json({ error: "Missing id or invalid point" }, { status: 400 });
    }

    const ticketRef = db.collection("club-etickets").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      console.error("Ticket not found for ID:", id);
      return NextResponse.json({ error: "ไม่พบตั๋ว" }, { status: 404 });
    }

    await ticketRef.update({ point });
    const updated = (await ticketRef.get()).data();
    console.log("Updated ticket points:", updated);
    return NextResponse.json({ message: "Point updated", ticket: updated });
  } catch (error) {
    console.error("PUT API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
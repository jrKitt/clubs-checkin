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

// Updated the logic to accept two IDs: `scannerID` and `peerID`.

export async function POST(req: NextRequest) {
  try {
    const { scannerID, peerID } = await req.json();

    if (!scannerID || !peerID) {
      return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษา" }, { status: 400 });
    }

    if (scannerID === peerID) {
      return NextResponse.json({ error: "ไม่สามารถเช็คอินตัวเองได้" }, { status: 400 });
    }

    // Check if the pair has already been checked in
    const pairCheckSnap = await db.collection("peer-checkins")
      .where("pair", "in", [
        `${scannerID}-${peerID}`,
        `${peerID}-${scannerID}`
      ])
      .limit(1).get();

    if (!pairCheckSnap.empty) {
      return NextResponse.json({ error: "คู่รหัสนี้ได้เช็คอินไปแล้ว" }, { status: 400 });
    }

    // Add a new check-in record for the pair
    await db.collection("peer-checkins").add({
      pair: `${scannerID}-${peerID}`,
      timestamp: new Date().toISOString(),
    });

    // Update points for both students
    const ticketsRef = db.collection("club-etickets");

    for (const studentID of [scannerID, peerID]) {
      const studentSnap = await ticketsRef.where("studentID", "==", studentID).limit(1).get();

      if (studentSnap.empty) {
        return NextResponse.json({ error: `ไม่พบข้อมูลตั๋วของนักศึกษา ${studentID}` }, { status: 404 });
      }

      const studentDoc = studentSnap.docs[0];
      const studentPoints = studentDoc.data().points || 0;

      await studentDoc.ref.update({ points: studentPoints + 30 });
    }

    return NextResponse.json({ 
      message: "Peer check-in success", 
      scannerID, 
      peerID, 
      pointsAwarded: 30 
    });

  } catch (error) {
    console.error("Peer Check-in API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

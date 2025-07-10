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
      return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษาทั้งสองคน" }, { status: 400 });
    }

    if (scannerID === peerID) {
      return NextResponse.json({ error: "ไม่สามารถเช็คอินตัวเองได้" }, { status: 400 });
    }

    // Check if the pair has already checked in together
    const checkSnap = await db.collection("peer-checkins")
      .where("scannerID", "==", scannerID)
      .where("peerID", "==", peerID)
      .limit(1).get();

    if (!checkSnap.empty) {
      return NextResponse.json({ error: "คู่เช็คอินนี้ได้เช็คอินไปแล้ว" }, { status: 400 });
    }

    // Add a new check-in record
    await db.collection("peer-checkins").add({
      scannerID,
      peerID,
      timestamp: new Date().toISOString(),
    });

    // Update points for both IDs in the tickets collection
    const ticketsRef = db.collection("club-etickets");

    const scannerSnap = await ticketsRef.where("studentID", "==", scannerID).limit(1).get();
    const peerSnap = await ticketsRef.where("studentID", "==", peerID).limit(1).get();

    if (scannerSnap.empty || peerSnap.empty) {
      return NextResponse.json({ error: "ไม่พบข้อมูลตั๋วของนักศึกษาทั้งสองคน" }, { status: 404 });
    }

    const scannerDoc = scannerSnap.docs[0];
    const peerDoc = peerSnap.docs[0];

    const scannerPoints = scannerDoc.data().points || 0;
    const peerPoints = peerDoc.data().points || 0;

    await scannerDoc.ref.update({ points: scannerPoints + 30 });
    await peerDoc.ref.update({ points: peerPoints + 30 });

    return NextResponse.json({ 
      status: "success", 
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

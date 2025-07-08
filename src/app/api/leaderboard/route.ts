import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const ticketsSnap = await db.collection("club-etickets").get();
    const leaderboard = ticketsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.name || "",
        point: data.points || data.point || 0,
        totalClubsCheckedIn: data.totalClubsCheckedIn || 0
      };
    });
    leaderboard.sort((a, b) => b.point - a.point);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
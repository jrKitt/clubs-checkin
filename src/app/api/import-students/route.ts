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
    const admins: {
      "smo-username": string;
      "smo-password": string;
      "smo-role": string;
      "smo-club": string;
      "smo-name": string;
      "smo-fullname": string;
      lastCheckInProcessed?: string;
      totalCheckInsProcessed?: number;
    }[] = await req.json();

    if (!Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json({ error: "No admins data" }, { status: 400 });
    }

    const batch = db.batch();
    admins.forEach((admin) => {
      const docRef = db.collection("admin").doc(admin["smo-username"]);
      batch.set(docRef, {
        "smo-username": admin["smo-username"],
        "smo-password": admin["smo-password"],
        "smo-role": admin["smo-role"],
        "smo-club": admin["smo-club"],
        "smo-name": admin["smo-name"],
        "smo-fullname": admin["smo-fullname"],
        lastCheckInProcessed: admin.lastCheckInProcessed ?? "",
        totalCheckInsProcessed: admin.totalCheckInsProcessed ?? 0,
      });
    });

    await batch.commit();
    return NextResponse.json({ message: "Import admin success", count: admins.length });
  } catch (error) {
    console.error("Import admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
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
    const { studentID, adminRole } = body;
    
    if (!studentID) {
      return NextResponse.json({ error: "StudentID is required" }, { status: 400 });
    }

    if (!adminRole || !adminRole.username || !adminRole.clubName) {
      return NextResponse.json({ error: "Admin role information is required" }, { status: 400 });
    }

    const adminSnap = await db.collection("admin").where("smo-username", "==", adminRole.username).limit(1).get();
    
    console.log('adminRole.username', adminRole.username);
    console.log('adminSnap.empty', adminSnap.empty);
    console.log('adminSnap.docs', adminSnap.docs.map(d => d.data()));

    if (adminSnap.empty) {
      return NextResponse.json({ error: "ไม่พบข้อมูล admin" }, { status: 404 });
    }

    const adminDoc = adminSnap.docs[0];
    const adminData = adminDoc.data();

    if (adminData["smo-club"] !== adminRole.clubName) {
      return NextResponse.json({ error: "Admin ไม่ได้อยู่ในชมรมที่ระบุ" }, { status: 403 });
    }

    if (adminData["smo-role"] !== adminRole.role) {
      return NextResponse.json({ error: "Admin role ไม่ถูกต้อง" }, { status: 403 });
    }

    const ticketSnap = await db.collection("club-etickets").where("studentID", "==", studentID).limit(1).get();

    if (ticketSnap.empty) {
      return NextResponse.json({ error: "ไม่พบข้อมูลตั๋ว" }, { status: 404 });
    }

    const ticketDoc = ticketSnap.docs[0];
    const ticketData = ticketDoc.data();


    interface ClubCheckIn {
      clubName: string;
      checkInAt: string;
      adminUsername: string;
      pointsAwarded: number;
    }
    const clubCheckIns: ClubCheckIn[] = ticketData.clubCheckIns || [];
    const alreadyCheckedIn = clubCheckIns.some((c: ClubCheckIn) => c.clubName === adminRole.clubName);
    if (alreadyCheckedIn) {
      return NextResponse.json({ error: "นักศึกษาได้เช็คอินที่ชมรมนี้แล้ว" }, { status: 400 });
    }

    const currentPoints = ticketData.points || 0;
    const newClubCheckIn = {
      clubName: adminRole.clubName,
      checkInAt: new Date().toISOString(),
      adminUsername: adminRole.username,
      pointsAwarded: 100
    };
    clubCheckIns.push(newClubCheckIn);
    await ticketDoc.ref.update({ 
      checkInStatus: true, 
      points: currentPoints + 100,
      clubCheckIns: clubCheckIns, 
      lastCheckInAt: new Date().toISOString(),
      lastCheckInClub: adminRole.clubName,
      totalClubsCheckedIn: clubCheckIns.length 
    });

    await db.collection("club-checkins").add({
      studentID: studentID,
      studentName: ticketData.name,
      clubName: adminRole.clubName,
      adminUsername: adminRole.username,
      checkInAt: new Date().toISOString(),
      pointsAwarded: 100
    });

    await adminDoc.ref.update({
      lastCheckInProcessed: new Date().toISOString(),
      totalCheckInsProcessed: (adminData.totalCheckInsProcessed || 0) + 1
    });

    const updatedTicket = (await ticketDoc.ref.get()).data();
    
    return NextResponse.json({ 
      message: "Check-in success", 
      ticket: updatedTicket,
      pointsAwarded: 100,
      clubName: adminRole.clubName
    });

  } catch (error) {
    console.error("E-Ticket API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubName = searchParams.get('clubName');
    const adminUsername = searchParams.get('adminUsername');

    if (clubName) {
      const checkInsSnap = await db.collection("club-checkins")
        .where("clubName", "==", clubName)
        .orderBy("checkInAt", "desc")
        .get();
      
      const checkIns = checkInsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ 
        clubCheckIns: checkIns,
        totalCheckIns: checkIns.length
      });
    }

    if (adminUsername) {
      const checkInsSnap = await db.collection("club-checkins")
        .where("adminUsername", "==", adminUsername)
        .orderBy("checkInAt", "desc")
        .get();
      
      const checkIns = checkInsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ 
        adminCheckIns: checkIns,
        totalProcessed: checkIns.length
      });
    }

    const ticketsSnap = await db.collection("club-etickets").get();
    const tickets = ticketsSnap.docs.map(doc => doc.data());
    
    const clubCheckInsSnap = await db.collection("club-checkins").get();
    const clubCheckIns = clubCheckInsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      tickets,
      clubCheckIns,
      statistics: {
        totalTickets: tickets.length,
        totalClubCheckIns: clubCheckIns.length,
        checkedInTickets: tickets.filter(t => t.checkInStatus).length
      }
    });
  } catch (error) {
    console.error("E-Ticket GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
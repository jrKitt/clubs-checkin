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

    // ตรวจสอบ admin role และชมรม
    const adminSnap = await db.collection("admins").where("username", "==", adminRole.username).limit(1).get();
    
    if (adminSnap.empty) {
      return NextResponse.json({ error: "ไม่พบข้อมูล admin" }, { status: 404 });
    }

    const adminDoc = adminSnap.docs[0];
    const adminData = adminDoc.data();

    // ตรวจสอบว่า admin นี้เป็นของชมรมที่ระบุหรือไม่
    if (adminData.clubName !== adminRole.clubName) {
      return NextResponse.json({ error: "Admin ไม่ได้อยู่ในชมรมที่ระบุ" }, { status: 403 });
    }

    // ตรวจสอบว่า admin role ที่ส่งมาตรงกับข้อมูลในฐานข้อมูลหรือไม่
    if (adminData.role !== adminRole.role) {
      return NextResponse.json({ error: "Admin role ไม่ถูกต้อง" }, { status: 403 });
    }

    // ค้นหา ticket ด้วย studentID
    const ticketSnap = await db.collection("e-tickets").where("studentID", "==", studentID).limit(1).get();

    if (ticketSnap.empty) {
      return NextResponse.json({ error: "ไม่พบข้อมูลตั๋ว" }, { status: 404 });
    }

    const ticketDoc = ticketSnap.docs[0];
    const ticketData = ticketDoc.data();

    // ตรวจสอบว่าเช็คอินที่ชมรมนี้แล้วหรือยัง
    const existingCheckIn = await db.collection("club-checkins")
      .where("studentID", "==", studentID)
      .where("clubName", "==", adminRole.clubName)
      .limit(1)
      .get();

    if (!existingCheckIn.empty) {
      return NextResponse.json({ error: "นักศึกษาได้เช็คอินที่ชมรมนี้แล้ว" }, { status: 400 });
    }

    // อัพเดท ticket: เพิ่ม 100 points และอัพเดทสถานะ check-in แบบ club-specific
    const currentPoints = ticketData.points || 0;
    const clubCheckIns = ticketData.clubCheckIns || [];
    
    // เพิ่มข้อมูล check-in ของชมรมใหม่
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

    const ticketsSnap = await db.collection("e-tickets").get();
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
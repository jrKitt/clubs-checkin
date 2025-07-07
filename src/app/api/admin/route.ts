import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const adminDoc = await db.collection('admin').doc('smo-01').get();

    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const adminData = adminDoc.data();

    if (
      username === adminData?.['smo-name'] &&
      password === adminData?.['smo-password']
    ) {
      return NextResponse.json({
        role: adminData!['smo-role'],
        name: adminData!['smo-name'],
      });
    } else {
      return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จชื่อหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in admin login API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
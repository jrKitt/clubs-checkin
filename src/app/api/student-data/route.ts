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
        const { StudentID } = await req.json();

        if (!StudentID) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        const studentSnap = await db
            .collection('student')
            .where('StudentID', '==', StudentID)
            .limit(100)
            .get();

        if (studentSnap.empty) {
            return NextResponse.json({ error: 'Invalid student ID' }, { status: 401 });
        }

        const students = studentSnap.docs.map(doc => doc.data());

        return NextResponse.json({ students });
    } catch (error) {
        console.error('Error in student-data API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

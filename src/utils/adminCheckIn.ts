interface ClubCheckIn {
  clubName: string;
  checkInAt: string;
  adminUsername: string;
  pointsAwarded: number;
}

interface TicketData {
  checkInStatus?: boolean;
  totalClubsCheckedIn?: number;
  clubCheckIns?: ClubCheckIn[];
  points?: number;
  lastCheckInClub?: string;
  lastCheckInAt?: string;
}

interface AdminRole {
  username: string;
  clubName: string;
  role: string;
  fullName?: string;
}


export const performAdminCheckIn = async (studentID: string) => {
  try {
    const adminRoleData = localStorage.getItem('adminRole');
    
    if (!adminRoleData) {
      throw new Error('ไม่พบข้อมูล admin role ใน localStorage');
    }

    const adminRole = JSON.parse(adminRoleData);
    
    if (!adminRole.username || !adminRole.clubName || !adminRole.role) {
      throw new Error('ข้อมูล admin role ไม่ครบถ้วน');
    }

    const response = await fetch('/api/e-ticket-checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentID,
        adminRole
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการเช็คอิน');
    }

    return data;
  } catch (error) {
    console.error('Admin check-in error:', error);
    throw error;
  }
};

export const setAdminRole = (adminData: AdminRole) => {
  localStorage.setItem('adminRole', JSON.stringify(adminData));
};

export const getAdminRole = (): AdminRole | null => {
  const adminRoleData = localStorage.getItem('adminRole');
  return adminRoleData ? JSON.parse(adminRoleData) : null;
};

export const clearAdminRole = () => {
  localStorage.removeItem('adminRole');
};

export const isAdminLoggedIn = () => {
  const adminRole = getAdminRole();
  return adminRole && adminRole.username && adminRole.clubName && adminRole.role;
};

export const getStudentCheckInStatus = (ticketData: TicketData) => {
  return {
    hasCheckedIn: ticketData.checkInStatus || false,
    totalClubsCheckedIn: ticketData.totalClubsCheckedIn || 0,
    clubCheckIns: ticketData.clubCheckIns || [],
    totalPoints: ticketData.points || 0,
    lastCheckInClub: ticketData.lastCheckInClub || null,
    lastCheckInAt: ticketData.lastCheckInAt || null
  };
};

export const hasCheckedInToClub = (ticketData: TicketData, clubName: string) => {
  const clubCheckIns = ticketData.clubCheckIns || [];
  return clubCheckIns.some((checkIn: ClubCheckIn) => checkIn.clubName === clubName);
};

export const getClubCheckInDetails = (ticketData: TicketData, clubName: string) => {
  const clubCheckIns = ticketData.clubCheckIns || [];
  return clubCheckIns.find((checkIn: ClubCheckIn) => checkIn.clubName === clubName) || null;
};

export const getCheckInStatistics = (ticketData: TicketData) => {
  const clubCheckIns = ticketData.clubCheckIns || [];
  
  return {
    totalClubs: clubCheckIns.length,
    totalPoints: ticketData.points || 0,
    averagePointsPerClub: clubCheckIns.length > 0 ? Math.round((ticketData.points || 0) / clubCheckIns.length) : 0,
    clubNames: clubCheckIns.map((checkIn: ClubCheckIn) => checkIn.clubName),
    firstCheckIn: clubCheckIns.length > 0 ? clubCheckIns[0].checkInAt : null,
    lastCheckIn: clubCheckIns.length > 0 ? clubCheckIns[clubCheckIns.length - 1].checkInAt : null
  };
};

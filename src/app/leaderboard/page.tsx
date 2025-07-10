"use client";
import React, { useEffect, useState, useRef } from "react";
import MobileNavbar from "@/app/components/Navbar/Navbar";
interface LeaderboardEntry {
  studentID: string;
  name: string;
  point: number;
  totalClubsCheckedIn?: number;
}

const getYearFromStudentID = (studentID: string): string => {
  const yearPrefix = studentID.slice(0, 2);
  switch (yearPrefix) {
    case "68":
      return "ปี 1";
    case "67":
      return "ปี 2";
    case "66":
      return "ปี 3";
    case "65":
      return "ปี 4";
    default:
      return "ไม่ทราบชั้นปี";
  }
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myIndex, setMyIndex] = useState<number | null>(null);
  const myCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch {}
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (myIndex !== null && myCardRef.current) {
      myCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [myIndex]);

  const handleSearch = () => {
    if (!search.trim()) return;
    const idx = leaderboard.findIndex((e) =>
      e.studentID.toLowerCase().includes(search.trim().toLowerCase())
    );
    setMyIndex(idx >= 0 ? idx : null);
  };

  const topThree = leaderboard.slice(0, 3).map(entry => ({
    ...entry,
    year: getYearFromStudentID(entry.studentID)
  }));
  const restOfList = leaderboard.slice(3).map(entry => ({
    ...entry,
    year: getYearFromStudentID(entry.studentID)
  }));

  const colors = {
    primary: "#003b7a",   
    secondary: "#0055b7",  
    accent: "#ffb81c",     
    light: "#e6f0ff",      
    white: "#ffffff",
    lightGray: "#f0f5ff",
    gray: "#e2e8f0"
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{background: `linear-gradient(to bottom, ${colors.lightGray}, ${colors.white})`}}>
      <MobileNavbar />
      <div className="container mx-auto px-4 py-6 max-w-md">
        
        <div className="flex items-center justify-between mb-6">
          <button className="p-2 opacity-0">
            <svg width="24" height="24" viewBox="0 0 24 24" />
          </button>
          <h1 className="text-2xl font-bold" style={{color: colors.primary}}>Leaderboard</h1>
          <button className="p-2 opacity-0">
            <svg width="24" height="24" viewBox="0 0 24 24" />
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <input
              className="w-full px-4 py-3 pr-12 rounded-full bg-white border shadow-sm"
              style={{borderColor: colors.gray, color: colors.primary}}
              placeholder="ค้นหาชื่อของคุณ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{color: colors.secondary}}
              onClick={handleSearch}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>

        {topThree.length > 0 && (
          <div className="flex justify-center items-end mb-10 mt-10">
            {topThree[1] && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white border-2 flex items-center justify-center mb-2 relative overflow-hidden shadow-md"
                     style={{borderColor: colors.secondary}}>
                  <span className="absolute top-0 left-0 right-0 py-1 text-white text-xs font-bold text-center"
                        style={{backgroundColor: colors.secondary}}>2</span>
                  <span className="text-xl font-bold mt-2" style={{color: colors.primary}}>{topThree[1].year.charAt(0)}</span>
                </div>
                <p className="font-medium text-sm max-w-[80px] truncate text-center" style={{color: colors.primary}}>{topThree[1].name} ({topThree[1].year})</p>
                <p className="font-bold" style={{color: colors.accent}}>{topThree[1].point} <span className="text-xs text-gray-500">/ {topThree[1].totalClubsCheckedIn ?? 0} ชมรม</span></p>
              </div>
            )}
            
            {topThree[0] && (
              <div className="flex flex-col items-center z-10 mx-4 -mb-4">
                <div className="relative">
                  <svg className="absolute -top-8 left-1/2 transform -translate-x-1/2" width="40" height="30" viewBox="0 0 40 30" fill={colors.accent}>
  <path d="M20 0L13 10L0 8L7 18L5 30L20 25L35 30L33 18L40 8L27 10L20 0Z" />
  <path d="M15 10L20 15L25 10L23 25L17 25L15 10Z" fill={colors.accent} />
  <circle cx="13" cy="8" r="2" fill="#FFF" />
  <circle cx="20" cy="5" r="2" fill="#FFF" />
  <circle cx="27" cy="8" r="2" fill="#FFF" />
</svg>
                  <div className="w-28 h-28 rounded-full bg-white border-4 flex items-center justify-center mb-2 relative overflow-hidden shadow-lg"
                       style={{borderColor: colors.accent}}>
                    <span className="absolute top-0 left-0 right-0 py-1 text-white text-xs font-bold text-center"
                          style={{backgroundColor: colors.accent}}>1</span>
                    <span className="text-2xl font-bold mt-2" style={{color: colors.primary}}>{topThree[0].year.charAt(0)}</span>
                  </div>
                </div>
                <p className="font-medium text-sm max-w-[100px] truncate text-center" style={{color: colors.primary}}>{topThree[0].name} ({topThree[0].year})</p>
                <p className="font-bold" style={{color: colors.accent}}>{topThree[0].point} <span className="text-xs text-gray-500">/ {topThree[0].totalClubsCheckedIn ?? 0} ชมรม</span></p>
              </div>
            )}
            
            {/* Third place */}
            {topThree[2] && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white border-2 flex items-center justify-center mb-2 relative overflow-hidden shadow-md"
                     style={{borderColor: colors.secondary}}>
                  <span className="absolute top-0 left-0 right-0 py-1 text-white text-xs font-bold text-center"
                        style={{backgroundColor: colors.secondary}}>3</span>
                  <span className="text-xl font-bold mt-2" style={{color: colors.primary}}>{topThree[2].year.charAt(0)}</span>
                </div>
                <p className="font-medium text-sm max-w-[80px] truncate text-center" style={{color: colors.primary}}>{topThree[2].name} ({topThree[2].year})</p>
                <p className="font-bold" style={{color: colors.accent}}>{topThree[2].point} <span className="text-xs text-gray-500">/ {topThree[2].totalClubsCheckedIn ?? 0} ชมรม</span></p>
              </div>
            )}
          </div>
        )}

        {/* List of other participants */}
        <div className="space-y-3 mt-8">
          {restOfList.map((entry, i) => {
            const idx = i + 4;
            const isMe = myIndex === idx - 1;
            
            return (
              <div
                key={entry.studentID + idx}
                ref={isMe ? myCardRef : undefined}
                className={`flex items-center py-3 px-4 rounded-2xl ${
                  isMe ? "bg-blue-50 border-2" : "bg-white border"
                } shadow-sm`}
                style={{
                  borderColor: isMe ? colors.secondary : colors.gray,
                  boxShadow: isMe ? `0 0 0 1px ${colors.secondary}` : ''
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm"
                     style={{backgroundColor: colors.secondary}}>
                  {idx}
                </div>
                <div className="flex-1">
                  <p className="font-medium" style={{color: colors.primary}}>{entry.name} ({entry.year})</p>
                </div>
                <div className="font-bold" style={{color: colors.accent}}>
                  {entry.point} <span className="text-xs text-gray-500">/ {entry.totalClubsCheckedIn ?? 0} ชมรม</span>
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                   style={{borderColor: `${colors.secondary} transparent transparent transparent`}}></div>
              <p className="mt-2" style={{color: colors.primary}}>Loading...</p>
            </div>
          )}
          
          {!loading && leaderboard.length === 0 && (
            <div className="text-center py-8" style={{color: colors.primary}}>
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
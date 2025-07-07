"use client";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const PAGE_SIZE = 10;
interface Ticket {
  id: string;
  name: string;
  studentID: string;
  faculty: string;
  foodType: string;
  foodNote: string;
  group: string | number;
  registeredAt: string;
  checkInStatus: boolean;
}

const AdminDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (role !== "admin") {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const fetchTickets = async () => {
        const res = await fetch("/api/e-ticket");
        const data = await res.json();
        setTickets(data.tickets || []);
      };
      fetchTickets();
    }
  }, [isAdmin]);

  if (isAdmin === false) {
    window.location.href = "/login";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h2>
          <p className="text-gray-700">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return null;
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.studentID?.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "checked-in") return matchesSearch && ticket.checkInStatus;
    if (selectedFilter === "not-checked-in") return matchesSearch && !ticket.checkInStatus;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalTickets = tickets.length;
  const checkedInCount = tickets.filter(ticket => ticket.checkInStatus).length;

  const handleExportCSV = () => {
    const headers = [
      "Ticket ID",
      "รหัสนักศึกษา",
      "ชื่อ-นามสกุล",
      "หลักสูตร",
      "อาหาร",
      "หมายเหตุ",
      "กลุ่ม",
      "ลงทะเบียนเมื่อ",
      "สถานะ"
    ];
    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      ticket.studentID,
      ticket.name,
      ticket.faculty,
      ticket.foodType,
      ticket.foodNote,
      ticket.group,
      ticket.registeredAt,
      ticket.checkInStatus ? "เช็คอินแล้ว" : "ยังไม่เช็คอิน"
    ]);
    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "e-ticket-list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTickets.map((ticket) => ({
        "Ticket ID": ticket.id,
        "รหัสนักศึกษา": ticket.studentID,
        "ชื่อ-นามสกุล": ticket.name,
        "หลักสูตร": ticket.faculty,
        "อาหาร": ticket.foodType,
        "หมายเหตุ": ticket.foodNote,
        "กลุ่ม": ticket.group,
        "ลงทะเบียนเมื่อ": ticket.registeredAt,
        "สถานะ": ticket.checkInStatus ? "เช็คอินแล้ว" : "ยังไม่เช็คอิน",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สรุปผลการลงทะเบียน");
    XLSX.writeFile(wb, "e-ticket-list.xlsx");
  };

  function getPagination(current: number, total: number) {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l: number | undefined = undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] ">
      <div className="bg-gradient-to-r from-[#30319D] to-[#4344b3] pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">จัดการระบบลงทะเบียนกิจกรรมรับน้องและเปิดโลก CP</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#30319D] transition-transform hover:transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#30319D]/10 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#30319D]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">จำนวนผู้ลงทะเบียนทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800">{totalTickets} คน</p>
              </div>
            </div>
          </div>
          
          {/* บัตรสถิติที่ 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500 transition-transform hover:transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500/10 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">เช็คอินแล้ว</p>
                <p className="text-2xl font-bold text-gray-800">{checkedInCount} คน</p>
              </div>
            </div>
          </div>
          
          {/* บัตรสถิติที่ 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-500 transition-transform hover:transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-500/10 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ยังไม่เช็คอิน</p>
                <p className="text-2xl font-bold text-gray-800">{totalTickets - checkedInCount} คน</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* ตารางรายการลงทะเบียน */}
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#30319D]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 002-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                รายการลงทะเบียน E-Ticket
              </h2>
              
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                {/* ฟิลเตอร์สถานะ */}
                <select 
                  className="rounded-lg border-gray-200 text-gray-700 text-sm px-3 py-2 focus:border-[#30319D] focus:ring focus:ring-[#30319D]/20"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="checked-in">เช็คอินแล้ว</option>
                  <option value="not-checked-in">ยังไม่เช็คอิน</option>
                </select>
                
                {/* ช่องค้นหา */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, รหัสนักศึกษา, Ticket ID"
                    className="w-full md:w-64 rounded-lg border-gray-200 text-sm pr-10 focus:border-[#30319D] focus:ring focus:ring-[#30319D]/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* ปุ่ม export */}
                <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium mr-2"
                    onClick={handleExportCSV}
                  >
                    ดาวน์โหลด CSV
                  </button>
                  <button
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    onClick={handleExportXLSX}
                  >
                    ดาวน์โหลด Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสนักศึกษา
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หลักสูตร
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อาหาร
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมายเหตุ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลงทะเบียนเมื่อ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {ticket.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {ticket.studentID}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{ticket.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {ticket.faculty}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.foodType === "อาหารทั่วไป" ? "bg-gray-100 text-gray-800" :
                          ticket.foodType === "อาหารเจ" ? "bg-green-100 text-green-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {ticket.foodType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="px-4 py-3 whitespace-nowrap text-xs text-red-500">
                          {ticket.foodNote}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {ticket.registeredAt}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {ticket.checkInStatus ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            เช็คอินแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ยังไม่เช็คอิน
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      ไม่พบข้อมูลที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ถัดไป
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  แสดง <span className="font-medium">{filteredTickets.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> ถึง <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)}</span> จาก <span className="font-medium">{filteredTickets.length}</span> รายการ
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  {getPagination(currentPage, totalPages).map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={idx}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-400 select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(Number(page))}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 ${currentPage === page ? "bg-[#30319D] text-white" : "bg-white text-gray-700 hover:bg-gray-50"} text-sm font-medium`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-20 bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center">
              <div className="bg-[#30319D] h-1 w-12 rounded-full mr-3"></div>
              <h5 className="font-bold text-gray-800">STUDENT UNION | College Of Computing</h5>
              <div className="bg-[#30319D] h-1 w-12 rounded-full ml-3"></div>
            </div>
            <p className="mt-2 text-gray-600">สโมสรนักศึกษาวิทยาลัยการคอมพิวเตอร์</p>
            <p className="text-gray-600">วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น</p>
            <p className="mt-4 text-gray-500 text-sm">
              &copy; 2025 CP SHOP. All rights reserved.
            </p>
          </div >
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
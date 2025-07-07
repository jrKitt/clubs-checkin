"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  IoGridOutline,
  IoLogOutOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoCalendarOutline
} from "react-icons/io5";

const navItems = [
  { name: "แดชบอร์ด", href: "/admin", icon: IoGridOutline },
  { name: "เช็คอิน", href: "/admin/checkin", icon: IoCalendarOutline },
];

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const AdminLayout: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // ป้องกันการรัน useEffect ที่เข้าถึง window ในระหว่าง server-side rendering
    if (typeof window === 'undefined') return;

    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    
    checkIfMobile();
    
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("role");
      localStorage.removeItem("adminName");
      window.location.href = "/login";
    }
  };

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link href={item.href} passHref>
        <div
          className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200 group cursor-pointer
            ${isActive 
              ? "bg-[#30319D] text-white shadow-md" 
              : "text-gray-600 hover:bg-[#f3f4fd]"
            }
          `}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          <Icon className={`text-lg ${isActive ? "text-white" : "text-[#30319D] group-hover:text-[#30319D]"}`} />
          <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : "block"}`}>
            {item.name}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Mobile sidebar overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 bg-white shadow-lg z-20
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "translate-x-0"}
          ${isSidebarOpen ? "w-64" : isMobile ? "w-64" : "w-20"}
          lg:relative
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Image src="/SMOLOGO.webp" alt="Logo" width={32} height={32} className="h-8 w-8" />
            {(isSidebarOpen || isMobile) && (
              <h1 className="ml-3 text-md font-bold text-[#30319D]">ระบบจัดการกิจกรรม</h1>
            )}
          </div>
          {isMobile ? (
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-gray-600"
            >
              <IoCloseOutline className="text-2xl" />
            </button>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block text-gray-600"
            >
              {isSidebarOpen ? (
                <IoChevronBackOutline />
              ) : (
                <IoChevronForwardOutline />
              )}
            </button>
          )}
        </div>

        {/* Sidebar navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
          <div className="pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <IoLogOutOutline className="text-lg text-red-500" />
              <span className={`ml-3 ${!isSidebarOpen && !isMobile ? "hidden" : "block"}`}>
                ออกจากระบบ
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="sticky top-0 bg-white shadow-sm z-10 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            {isMobile && (
              <button
                className="mr-4 text-gray-600"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <IoMenuOutline className="text-2xl" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => item.href === pathname)?.name || "แอดมิน"}
            </h1>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#30319D]/10 flex items-center justify-center">
                <IoPersonOutline className="text-[#30319D]" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">แอดมิน</span>
            </div>
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-gray-600"
            >
              <IoLogOutOutline className="text-xl" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 overflow-auto bg-[#f8f9fc]">
          <div className="text-sm text-gray-500 mb-4 hidden lg:block">
            <span>แอดมิน</span>
            <span className="mx-2">{">"}</span>
            <span className="text-[#30319D] font-medium">
              {navItems.find((item) => item.href === pathname)?.name || ""}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow p-4 min-h-[calc(100vh-120px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
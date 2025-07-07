"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${
            scrolled ? "bg-[#30319D]/95 backdrop-blur-sm shadow-lg py-2" : "bg-[#30319D] py-4"
        }`}>
            <div className="max-w-7xl flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center space-x-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
                        <Image
                            src="/SMOLOGO.webp"
                            alt="SMOCP Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-white tracking-wider">
                            SMOCP
                        </span>
                        <span className="text-xs text-blue-200 hidden sm:block">
                           STUDENT UNION | College Of Computing
                        </span>
                    </div>
                </Link>
                
                {/* เมนูแบบ Desktop */}
                <div className="hidden md:flex items-center space-x-1">
                    <Link
                        href="/"
                        className="px-4 py-2 text-white hover:text-blue-200 rounded-md text-sm font-medium transition-colors duration-200 relative group"
                        onClick={() => {
                            if (typeof window !== "undefined") localStorage.clear();
                        }}
                    >
                        ลงทะเบียนกิจกรรม
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                
                    <Link
                        href="https://www.smocp.com/"
                        className="px-4 py-2 text-white hover:text-blue-200 rounded-md text-sm font-medium transition-colors duration-200 relative group"
                    >
                        เกี่ยวกับเรา
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                    <Link
                        href="/login"
                        className="ml-2 px-5 py-2 bg-white text-[#30319D] hover:bg-blue-50 rounded-full text-sm font-medium transition-all duration-200 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        เข้าสู่ระบบ
                    </Link>
                </div>
                
                {/* ปุ่มแฮมเบอร์เกอร์สำหรับมือถือ */}
                <button
                    type="button"
                    className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:text-blue-200 hover:bg-[#3f40b5] focus:outline-none transition duration-200"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className="sr-only">เปิดเมนูหลัก</span>
                    {menuOpen ? (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>
            
            <div className={`md:hidden transition-all duration-300 ease-in-out ${
                menuOpen 
                ? "max-h-60 opacity-100" 
                : "max-h-0 opacity-0 overflow-hidden"
            }`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#2b2c8d]">
                    <Link
                        href="/"
                        className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#3f40b5] transition-colors duration-200"
                        onClick={() => {
                            setMenuOpen(false);
                            if (typeof window !== "undefined") localStorage.clear();
                        }}
                    >
                        ลงทะเบียนกิจกรรม
                    </Link>
                    <Link
                        href="https://www.smocp.com/"
                        className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#3f40b5] transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                    >
                        เกี่ยวกับเรา
                    </Link>
                    <Link
                        href="/login"
                        className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#3f40b5] transition-colors duration-200 flex items-center"
                        onClick={() => setMenuOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        เข้าสู่ระบบ
                    </Link>
                </div>
            </div>
        </nav>
    );
}
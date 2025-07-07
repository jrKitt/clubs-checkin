"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileNavbar from "@/app/components/Navbar/Navbar";

const Page = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("role", data.role);
        localStorage.setItem("adminName", data.name);
        router.push("/admin");
      } else {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <MobileNavbar /> 
      <div className="container mx-auto px-4 py-25 max-w-md ">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <Image
              src="/SMOLOGO.webp"
              alt="Logo"
              width={56}
              height={56}
              className="h-14 mb-2"
              priority
            />
            <h1 className="text-2xl font-bold text-blue-800 mb-1">ระบบผู้ดูแล</h1>
            <p className="text-sm text-gray-600 mb-2">
              Admin Panel | College of Computing
            </p>
          </div>
          <form
            onSubmit={handleLogin}
            className="px-8 pb-8 pt-2"
          >
            <div className="mb-4">
              <label className="block mb-1 text-gray-700 font-medium">
                Username
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black outline-none transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-gray-700 font-medium">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-3 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-medium text-white ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              } transition-all`}
              disabled={loading}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
        <footer className="mt-8 text-center text-gray-500 text-xs">
          <h5 className="font-bold">STUDENT UNION | College Of Computing</h5>
          <p className="mb-1">สโมสรนักศึกษาวิทยาลัยการคอมพิวเตอร์</p>
          <p className="mb-2">วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น</p>
          <p className="text-secondary mb-0">&copy; 2025 CP SHOP. All rights reserved.</p>
        </footer>
      </div>
    </div>
    </div>
  );
};

export default Page;

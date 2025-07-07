"use client";
import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Ticket {
  id: string;
  studentID: string;
  name: string;
  faculty?: string;
  group?: string;
  checkInStatus: boolean;
}

export default function QrcodeCheckin() {
  const [input, setInput] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");
  const [scanning, setScanning] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<Ticket[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [html5Qr, setHtml5Qr] = useState<Html5Qrcode | null>(null);
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (html5Qr) {
        html5Qr.stop().catch(() => {});
        html5Qr.clear();
      }
    };
  }, [html5Qr]);

  useEffect(() => {
    if (!scanning) {
      setHasScanned(false);
      return;
    }
    if (scanning && readerRef.current) {
      const qr = new Html5Qrcode("reader", false);
      setHtml5Qr(qr);

      Html5Qrcode.getCameras()
        .then((devices) => {
          let cameraId = devices[0]?.id || undefined;
          if (devices.length > 1) {
            const backCam = devices.find((d) =>
              d.label.toLowerCase().includes("back")
            );
            if (backCam) cameraId = backCam.id;
          }
          if (!cameraId) {
            setResult("ไม่พบกล้องบนอุปกรณ์นี้");
            setResultType("error");
            setScanning(false);
            return;
          }
          qr.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            onScanSuccess,
            () => {}
          ).catch((err) => {
            setResult("ไม่สามารถเปิดกล้องได้: " + err);
            setResultType("error");
            setScanning(false);
          });
        })
        .catch(() => {
          setResult("ไม่พบกล้องบนอุปกรณ์นี้");
          setResultType("error");
          setScanning(false);
        });
    }
    // eslint-disable-next-line
  }, [scanning]);

  const onScanSuccess = (decodedText: string) => {
    if (hasScanned) return;
    setHasScanned(true);
    stopScanner();
    setInput(decodedText);
  };

  const startScanner = () => {
    setResult("");
    setResultType("");
    setScanning(true);
  };

  const stopScanner = () => {
    if (html5Qr) {
      html5Qr.stop().catch(() => {});
      html5Qr.clear();
      setHtml5Qr(null);
    }
    setScanning(false);
  };

  const handleSearch = async (searchValue?: string) => {
    const value = searchValue ?? scannedValue ?? input;
    if (!value.trim()) return;
    setLoading(true);
    setResult("");
    setResultType("");
    setTicket(null);
    try {
      const res = await fetch("/api/e-ticket");
      const data = await res.json();
      const search = value.toLowerCase();
      const found = data.tickets.find(
        (t: Ticket) =>
          t.id?.toLowerCase() === search ||
          t.studentID?.toLowerCase() === search ||
          t.name?.toLowerCase().includes(search)
      );
      if (!found) {
        setResult("ไม่พบข้อมูลตั๋ว");
        setResultType("error");
      } else {
        setTicket(found);
        setResult("");
      }
    } catch {
      setResult("เกิดข้อผิดพลาดในการค้นหา");
      setResultType("error");
    }
    setLoading(false);
    setScannedValue(null);
  };

  const handleCheckin = async () => {
    if (!ticket?.id) return;
    setLoading(true);
    setResult("");
    setResultType("");
    try {
      const res = await fetch("/api/e-ticket-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentID: ticket.studentID }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedTicket = { ...ticket, checkInStatus: true };
        setTicket(updatedTicket);
        setResult("เช็คอินสำเร็จ");
        setResultType("success");
        setRecentCheckins((prev) => [updatedTicket, ...prev].slice(0, 5));
        setTimeout(() => {
          setInput("");
          setTicket(null);
          setResult("");
        }, 3000);
      } else {
        setResult(data.error || "เช็คอินไม่สำเร็จ");
        setResultType("error");
      }
    } catch {
      setResult("เกิดข้อผิดพลาดในการเช็คอิน");
      setResultType("error");
    }
    setLoading(false);
  };

  const getResultClass = () => {
    if (resultType === "success")
      return "bg-green-100 border-green-500 text-green-700";
    if (resultType === "error") return "bg-red-100 border-red-500 text-red-700";
    return "";
  };
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (role !== "admin") {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
  }, []);

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
  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#30319D] mb-2">
            ระบบเช็คอินกิจกรรม
          </h1>
          <p className="text-gray-600">กิจกรรมรับน้องและเปิดโลก CP</p>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-5">
            <div className="mb-5">
              <label
                htmlFor="search-input"
                className="block text-sm font-medium text-black mb-1"
              >
                ค้นหาข้อมูล
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  className="border text-black border-gray-300 rounded-lg p-3 w-full pl-10 focus:ring-2 focus:ring-[#30319D] focus:border-[#30319D] transition"
                  placeholder="กรอก Ticket ID, ชื่อ, หรือรหัสนักศึกษา"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={loading || scanning}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex space-x-3">
                <button
                  className="flex-1 bg-[#30319D] hover:bg-[#262783] text-white px-4 py-2.5 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSearch()}
                  disabled={loading || scanning || !input.trim()}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      กำลังค้นหา...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                      ค้นหา
                    </>
                  )}
                </button>
                <button
                  className={`flex-1 ${
                    scanning
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  } text-white px-4 py-2.5 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={scanning ? stopScanner : startScanner}
                  disabled={loading}
                >
                  {scanning ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                      หยุดสแกน
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        ></path>
                      </svg>
                      สแกน QR Code
                    </>
                  )}
                </button>
              </div>
            </div>
            {scanning && (
              <div className="mb-5">
                <div className="relative mx-auto" style={{ maxWidth: "300px" }}>
                  <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none z-10 animate-pulse"></div>
                  <div
                    className="overflow-hidden rounded-lg"
                    style={{ width: "100%", height: "300px" }}
                  >
                    <div
                      id="reader"
                      ref={readerRef}
                      style={{ width: "100%", height: "300px" }}
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  วางให้ QR Code อยู่ในกรอบเพื่อสแกน
                </p>
              </div>
            )}
            {result && (
              <div className={`p-3 mb-4 rounded-lg border ${getResultClass()}`}>
                <div className="flex items-center">
                  {resultType === "success" ? (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  )}
                  <span>{result}</span>
                </div>
              </div>
            )}
            {ticket && (
              <div className="border rounded-lg overflow-hidden bg-gray-50 mb-4 transition-all animate-fadeIn">
                <div className="bg-gray-100 border-b p-3 flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">
                    ข้อมูลผู้ลงทะเบียน
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      ticket.checkInStatus
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {ticket.checkInStatus ? "เช็คอินแล้ว" : "ยังไม่เช็คอิน"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap md:flex-nowrap">
                    <div className="w-full md:w-3/4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-500">ชื่อ-สกุล</p>
                          <p className="font-semibold text-gray-800">
                            {ticket.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">รหัสนักศึกษา</p>
                          <p className="font-medium text-gray-800">
                            {ticket.studentID}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ticket ID</p>
                          <p className="font-medium text-gray-700">
                            {ticket.id}
                          </p>
                        </div>
                        {ticket.faculty && (
                          <div>
                            <p className="text-sm text-gray-500">หลักสูตร</p>
                            <p className="font-medium text-gray-800">
                              {ticket.faculty}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {ticket.group && (
                      <div className="w-full md:w-1/4 flex justify-center items-center mt-4 md:mt-0">
                        <div className="w-16 h-16 rounded-full bg-[#30319D] flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {ticket.group}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {!ticket.checkInStatus && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleCheckin}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            กำลังดำเนินการ...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            ยืนยันการเช็คอิน
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {recentCheckins.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#30319D] to-[#4344b3] p-4 text-white">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-sm font-semibold">การเช็คอินล่าสุด</h2>
              </div>
            </div>
            <div className="p-3">
              <ul className="divide-y divide-gray-100">
                {recentCheckins.map((checkin, index) => (
                  <li
                    key={index}
                    className="py-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {checkin.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {checkin.studentID} • {checkin.id}
                      </p>
                    </div>
                    {checkin.group && (
                      <div className="w-8 h-8 rounded-full bg-[#30319D]/90 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {checkin.group}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import MobileNavbar from "@/app/components/Navbar/Navbar";
import { IoQrCodeOutline, IoScanOutline, IoPersonOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ClubCheckIn {
  clubName: string;
  checkInAt: string;
  adminUsername: string;
  pointsAwarded: number;
}

interface Ticket {
  id: string;
  studentID: string;
  name: string;
  faculty?: string;
  group?: string;
  checkInStatus: boolean;
  clubCheckIns?: ClubCheckIn[];
}

const TARGET_LOCATION = { lat: 16.47551, lng: 102.825045 }; 
const MIN_DISTANCE = 0; 
const MAX_DISTANCE = 500; 

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const R = 6371e3; 
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const checkLocationPermission = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation is not supported by your browser.");
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          TARGET_LOCATION.lat,
          TARGET_LOCATION.lng
        );
        if (distance >= MIN_DISTANCE && distance <= MAX_DISTANCE) {
          resolve();
        } else {
          reject("คุณต้องอยู่ในSC09 อาคารวิทยวิภาส คณะวิทยาศาสตร์ มหาวิทยาลัยขอนแก่นเท่านั้น");
        }
      },
      () => reject("ไม่สามารถเข้าถึงตำแหน่งของคุณได้")
    );
  });
};

export default function QrcodeCheckin() {
  const [scannerID, setScannerID] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("scannerID") || "";
    }
    return "";
  });
  const [peerID, setPeerID] = useState("");
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");
  const [scanning, setScanning] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<Ticket[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [html5Qr, setHtml5Qr] = useState<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"scan" | "manual">("scan");

  useEffect(() => {
    return () => {
      if (html5Qr) {
        html5Qr.stop().catch(() => {});
        html5Qr.clear();
      }
    };
  }, [html5Qr]);

  useEffect(() => {
    if (typeof window !== "undefined" && scannerID) {
      localStorage.setItem("scannerID", scannerID);
    }
  }, [scannerID]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedScannerID = localStorage.getItem("scannerID") || "";
      setScannerID(storedScannerID);
    }
  }, []);

  useEffect(() => {
    if (scanning && (scannerID.trim() === "")) {
      setResult("กรุณากรอกรหัสนักศึกษาของคุณก่อนสแกน");
      setResultType("error");
      setScanning(false);
      return;
    }
    
    if (!scanning) {
      setHasScanned(false);
      return;
    }
    
    if (scanning && readerRef.current) {
      const qr = new Html5Qrcode("reader", false);
      setHtml5Qr(qr);

      Html5Qrcode.getCameras()
        .then((devices) => {
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back")
          );
          const cameraId = backCam?.id;
          if (!cameraId) {
            setResult("ไม่พบกล้องหลังบนอุปกรณ์นี้");
            setResultType("error");
            setScanning(false);
            return;
          }
          qr
            .start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              onScanSuccess,
              () => {}
            )
            .catch((err) => {
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
  }, [scanning, scannerID]);

  useEffect(() => {
    const clearHistoryTimeout = setTimeout(() => {
      setRecentCheckins([]);
    }, 180000); // Clear history after 3 minutes

    return () => clearTimeout(clearHistoryTimeout);
  }, [recentCheckins]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRecentCheckins([]); 
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [])

  const fetchStudentName = async (): Promise<Record<string, string>> => {
    try {
      const res = await fetch(`/api/e-ticket`); 
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        return data.reduce((acc: Record<string, string>, student) => {
          acc[student.studentID] = student.name;
          return acc;
        }, {});
      }
    } catch {
      console.error("Failed to fetch student data from /api/e-ticket");
    }
    return {}; 
  };

  const handleCheckin = async () => {
    try {
      await checkLocationPermission();
    } catch (error) {
      const errorMessage = typeof error === "string" ? error : "เกิดข้อผิดพลาด";
      setResult(errorMessage);
      setResultType("error");
      toast.error(errorMessage);
      return;
    }

    if (!scannerID || !peerID) {
      setResult("กรุณากรอกรหัสนักศึกษาทั้งสองช่อง");
      setResultType("error");
      return;
    }

    if (scannerID === peerID) {
      setResult("ไม่สามารถเช็คอินตัวเองได้");
      setResultType("error");
      return;
    }

    setResult("");
    setResultType("");
    try {
      const res = await fetch("/api/peer-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerID, peerID }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success("เช็คอินสำเร็จ! คุณและเพื่อนได้รับ 30 คะแนน");
        const studentData = await fetchStudentName(); // Fetch all student data
        const name = studentData[peerID] || "ไม่ทราบชื่อ"; // Ensure name is fetched or default to "ไม่ทราบชื่อ"
        if (!name) return;

        setRecentCheckins((prev) => {
          const updatedCheckins = [
            { id: peerID, studentID: peerID, name, checkInStatus: true },
            ...prev,
          ];
          const uniqueCheckins = Array.from(
            new Map(updatedCheckins.map((item) => [item.id, item])).values()
          );
          return uniqueCheckins.slice(0, 5);
        });
        setTimeout(() => {
          setPeerID("");
          setResult("");
        }, 3000);
      } else {
        toast.error(data.error || "เช็คอินไม่สำเร็จ");
        setResult(data.error || "เช็คอินไม่สำเร็จ");
        setResultType("error");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเช็คอิน");
      setResult("เกิดข้อผิดพลาดในการเช็คอิน");
      setResultType("error");
    }
  };

  let debounceTimeout: NodeJS.Timeout | null = null;

  const onScanSuccess = (decodedText: string) => {
    if (hasScanned) return; // Prevent multiple requests
    setHasScanned(true); // Set the flag to true immediately

    if (debounceTimeout) {
      clearTimeout(debounceTimeout); // Clear any existing debounce timeout
    }

    debounceTimeout = setTimeout(() => {
      if (html5Qr) {
        html5Qr.stop().catch(() => {}); // Stop the camera immediately after a successful scan
        html5Qr.clear();
      }

      setScanning(false);
      setTab("manual"); 

      setPeerID(decodedText);

      const inputField = document.querySelector("input[placeholder='กรอกรหัสนักศึกษาของเพื่อน']") as HTMLInputElement;
      if (inputField) {
        inputField.focus();
      }

      // Proceed with API call
      if (!scannerID || !decodedText) {
        setResult("กรุณากรอกรหัสนักศึกษาทั้งสองช่อง");
        setResultType("error");
        setHasScanned(false); // Reset the flag if validation fails
        return;
      }

      if (scannerID === decodedText) {
        setResult("ไม่สามารถเช็คอินตัวเองได้");
        setResultType("error");
        setHasScanned(false); // Reset the flag if validation fails
        return;
      }

      fetch("/api/peer-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerID, peerID: decodedText }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.status === "success") {
            toast.success("เช็คอินสำเร็จ! คุณและเพื่อนได้รับ 30 คะแนน");
            const studentData = await fetchStudentName(); // Fetch all student data
            const name = studentData[decodedText] || "ไม่ทราบชื่อ"; // Ensure name is fetched or default to "ไม่ทราบชื่อ"
            if (!name) return;

            setResult("เช็คอินสำเร็จ! คุณและเพื่อนได้รับ 30 คะแนน");
            setResultType("success");
            setRecentCheckins((prev) => [
              { id: decodedText, studentID: decodedText, name, checkInStatus: true },
              ...prev,
            ].slice(0, 5));
            setTimeout(() => {
              setPeerID("");
              setResult("");
              setHasScanned(false); // Reset the flag after successful check-in
            }, 3000);
          } else {
            setResult(data.error || "เช็คอินไม่สำเร็จ");
            setResultType("error");
            setHasScanned(false); // Reset the flag if the request fails
          }
        })
        .catch(() => {
          setResult("เกิดข้อผิดพลาดในการเช็คอิน");
          setResultType("error");
          setHasScanned(false); // Reset the flag if an error occurs
        })
        .finally(() => {
          setHasScanned(false); // Reset the flag after the request completes
        });
    }, 300); // Debounce delay of 300ms
  };

  const startScanning = () => {
    if (!scannerID) {
      setResult("กรุณากรอกรหัสนักศึกษาของคุณก่อนสแกน");
      setResultType("error");
      return;
    }

    if (html5Qr) {
      html5Qr.clear(); // Clear any previous instance
      setHtml5Qr(null);
    }

    setScanning(true);
    setResult("");
    setResultType("");
  };

  const stopScanning = () => {
    setScanning(false);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavbar />
      <div className="container mx-auto px-4 pt-6 pb-20 max-w-md">
        {/* Header */}
   

        {/* User ID */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 mt-25">
          <div className="flex items-center space-x-3 mb-3">
            <IoPersonOutline className="text-blue-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">รหัสนักศึกษาของคุณ</h2>
          </div>
          <input
            type="text"
            value={scannerID}
            onChange={(e) => setScannerID(e.target.value)}
            className="w-full p-3 text-center text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-black bg-gray-50"
            placeholder="กรุณากรอกรหัสนักศึกษาของคุณ"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="flex border-b">
            <button 
              className={`flex-1 py-3 px-4 font-medium flex items-center justify-center ${tab === 'scan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('scan')}
            >
              <IoQrCodeOutline className="mr-2 text-xl" />
              สแกน QR Code
            </button>
            <button 
              className={`flex-1 py-3 px-4 font-medium flex items-center justify-center ${tab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('manual')}
            >
              <IoPersonOutline className="mr-2 text-xl" />
              กรอกรหัสเอง
            </button>
          </div>

          {/* Scanner Tab */}
          {tab === 'scan' && (
            <div className="p-5">
              <div className="mb-4">
                <div 
                  id="reader" 
                  ref={readerRef} 
                  className={`w-full aspect-square max-w-xs mx-auto rounded-lg ${scanning ? "border-blue-500 border-4" : "border-gray-200 border-2"}`}
                />
                {!scanning && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    
                  </div>
                )}
              </div>
              
              <p className="text-center text-gray-600 mb-4">
                {scanning ? "กำลังสแกน QR Code ของเพื่อน..." : "แสกน QR Code จากโทรศัพท์ของเพื่อน"}
              </p>
              
              <button
                onClick={scanning ? stopScanning : startScanning}
                className={`w-full px-4 py-3 text-white rounded-lg shadow-md focus:outline-none flex items-center justify-center font-medium text-lg ${
                  scanning ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <IoScanOutline className="mr-2 text-xl" />
                {scanning ? "หยุดสแกน" : "เริ่มสแกน"}
              </button>
            </div>
          )}

          {/* Manual Entry Tab */}
          {tab === 'manual' && (
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">รหัสนักศึกษาของเพื่อน</label>
                <input
                  type="text"
                  value={peerID}
                  onChange={(e) => setPeerID(e.target.value)}
                  className="w-full p-3 text-center text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-black bg-gray-50"
                  placeholder="กรอกรหัสนักศึกษาของเพื่อน"
                />
              </div>
              
              <button
                onClick={handleCheckin}
                className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none flex items-center justify-center font-medium text-lg"
              >
                <IoCheckmarkCircleOutline className="mr-2 text-xl" />
                ยืนยันการเช็คอิน
              </button>
            </div>
          )}
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`w-full p-4 mb-6 text-center rounded-xl shadow-md flex items-center justify-center ${
              resultType === "success"
                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}
          >
            {resultType === "success" ? (
              <IoCheckmarkCircleOutline className="mr-2 text-xl" />
            ) : (
              <IoCloseCircleOutline className="mr-2 text-xl" />
            )}
            {result}
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />

        {/* Recent Check-ins */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center space-x-3 mb-4">
            <IoCheckmarkCircleOutline className="text-blue-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">ประวัติการเช็คอินล่าสุด</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCheckins.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p>ยังไม่มีประวัติการเช็คอิน</p>
                <p className="text-sm mt-1">เช็คอินกับเพื่อนเพื่อรับคะแนน</p>
              </div>
            ) : (
              recentCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div>
                      <span className="block font-medium text-gray-800">
                        {checkin.name || "ไม่ทราบชื่อ"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    +30 คะแนน
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
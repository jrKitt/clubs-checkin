import React from "react";
const Page = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">กรอกข้อมูลในการลงทะเบียน</h1>

        <p className="text-sm text-gray-600 mb-4">
          * ข้อมูลในการลงทะเบียนจะถูกนำมาใช้ในการจัดกิจกรรม รวมถึงส่งข้อมูล
          ให้กับหน่วยปฐมพยาบาลเพื่อการดูแลอย่างใกล้ชิด
          <a href="/privacy" className="text-blue-600 block mt-1">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>

        <div className="mt-8">
          <h2 className="text-xl font-medium text-center mb-4">
            ตรวจสอบรหัสนักศึกษา
          </h2>

          <div className="border border-gray-300 rounded-lg p-4 mb-2">
            <label className="block text-sm mb-2">รหัสนักศึกษา</label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2 mr-2"
                placeholder="กรอกรหัสนักศึกษา"
              />
              <button className="bg-gray-800 text-white px-4 py-2 rounded-md">
                ตรวจสอบ
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              กรอกรหัสนักศึกษา เช่น 6730401XX-X
            </p>

            <div className="mt-4">
              <label className="flex items-center">
                <input type="checkbox" className="h-5 w-5 mr-2" />
                <span className="text-sm">ยังไม่ได้รับรหัสนักศึกษา</span>
              </label>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-medium mb-4">กรอกข้อมูลส่วนตัว</h2>

            <div className="mb-4">
              <label className="block text-sm mb-2">ชื่อและนามสกุล *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3"
                placeholder="กรอกชื่อและนามสกุล"
              />
              <p className="text-sm text-gray-500 mt-1">
                กรอกชื่อและนามสกุล(ไม่ต้องระบุคำนำหน้า) เช่น นายไอดี
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">คณะ *</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded-md p-3 appearance-none bg-white">
                  <option>เลือกคณะ เช่น คณะวิศวกรรมศาสตร์</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">ประเภทอาหาร</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded-md p-3 appearance-none bg-white">
                  <option>อาหารทั่วไป</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

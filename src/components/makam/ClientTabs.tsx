"use client";

import { useState } from "react";

const STATUS_COLORS = {
  AVAILABLE: { bg: "#81C784", label: "Tersedia" },
  RESERVED: { bg: "#FFB74D", label: "Dipesan" },
  OCCUPIED: { bg: "#E57373", label: "Terisi" },
};

interface GravePlot {
  blok: string;
  nomor: number;
  status: string;
  deceased_name?: string;
  user_id?: string;
  applicant_name?: string;
  applicant_phone?: string;
  created_at?: string;
}

interface ClientTabsProps {
  defaultTab: string;
  isAdmin: boolean;
  userId: string | null;
  graveMap: Record<string, GravePlot>;
  isLoggedIn: boolean;
}

export function ClientTabs({ defaultTab, isAdmin, userId, graveMap, isLoggedIn }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<GravePlot | null>(null);

  const showBlur = !isLoggedIn;

  const handlePlotClick = (blok: string, nomor: number) => {
    const key = `${blok}${nomor}`;
    const grave = graveMap[key];
    
    if (isAdmin && grave && (grave.status === "OCCUPIED" || grave.status === "RESERVED")) {
      setModalData(grave);
      setShowModal(true);
    }
  };

  const handlePlotHover = (blok: string, nomor: number) => {
    const key = `${blok}${nomor}`;
    if (isAdmin) {
      setHoveredPlot(key);
    }
  };

  const blocks = ["A", "B", "C", "D", "E"];

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {blocks.map((blok) => (
            <button
              key={blok}
              onClick={() => setActiveTab(blok)}
              className={`flex-1 min-w-[60px] py-3 px-4 text-sm font-bold transition-colors ${
                activeTab === blok 
                  ? "bg-slate-800 text-white" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Blok {blok}
            </button>
          ))}
        </div>

        <div className="p-4">
          {showBlur ? (
            <div className="relative">
              <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 filter blur-md opacity-50 pointer-events-none">
                {Array.from({ length: 19 }, (_, i) => i + 1).map((num) => (
                  <div key={`${activeTab}${num}`} className="aspect-square rounded-lg bg-slate-300" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Login Diperlukan</h3>
                  <p className="text-sm text-slate-600 mb-3">Silakan login untuk melihat peta lengkap</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Array.from({ length: 19 }, (_, i) => i + 1).map((num) => {
                const key = `${activeTab}${num}`;
                const grave = graveMap[key];
                const status = grave?.status || "AVAILABLE";
                const bgColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.bg || STATUS_COLORS.AVAILABLE.bg;
                const showDetails = isAdmin && grave && (status === "OCCUPIED" || status === "RESERVED");
                const canViewPrivate = isAdmin || (userId && grave?.user_id === userId);

                return (
                  <div
                    key={key}
                    onClick={() => handlePlotClick(activeTab, num)}
                    onMouseEnter={() => handlePlotHover(activeTab, num)}
                    onMouseLeave={() => setHoveredPlot(null)}
                    className={`relative aspect-square rounded-lg border-b-2 cursor-pointer transition-all ${
                      showDetails ? "hover:scale-110 hover:shadow-md hover:z-10" : ""
                    } flex items-center justify-center text-[10px] md:text-xs font-bold`}
                    style={{ backgroundColor: bgColor, borderColor: bgColor, color: "#1a1a1a" }}
                  >
                    <span>{activeTab}{num}</span>
                    
                    {!canViewPrivate && status === "OCCUPIED" && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-[8px] text-slate-500">Privat</span>
                      </div>
                    )}
                    
                    {showDetails && isAdmin && hoveredPlot === key && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg whitespace-nowrap z-20">
                        <div className="font-bold">{grave.deceased_name || "N/A"}</div>
                        <div className="opacity-70">{grave.applicant_name || "N/A"}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detail Petak {modalData.blok}{modalData.nomor}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${
                  modalData.status === "AVAILABLE" ? "text-emerald-600" :
                  modalData.status === "RESERVED" ? "text-amber-600" : "text-rose-600"
                }`}>
                  {STATUS_COLORS[modalData.status as keyof typeof STATUS_COLORS]?.label}
                </span>
              </div>
              
              {modalData.deceased_name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Nama Jenazah</span>
                  <span className="font-medium">{modalData.deceased_name}</span>
                </div>
              )}
              
              {modalData.applicant_name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Pemohon</span>
                  <span className="font-medium">{modalData.applicant_name}</span>
                </div>
              )}
              
              {modalData.applicant_phone && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Telepon</span>
                  <span className="font-medium">{modalData.applicant_phone}</span>
                </div>
              )}
              
              {modalData.created_at && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-medium">
                    {new Date(modalData.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
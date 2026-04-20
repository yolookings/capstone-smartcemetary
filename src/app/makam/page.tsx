import { query } from "@/lib/db";
import { Search, Filter, MapPin, Navigation } from "lucide-react";

export default async function MakamPublicPage() {
  // Publicly, we only show graves that are AVAILABLE (general map)
  // Deceased information is private and NOT shown here
  const gravesRes = await query(`
    SELECT blok, nomor, status 
    FROM makam 
    ORDER BY blok ASC, nomor ASC
  `);
  const graves = gravesRes.rows;

  return (
    <div className="flex flex-col min-h-screen bg-neutral">
      <div className="container mx-auto px-4 lg:px-12 py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Pemetaan Lahan Pemakaman</h1>
          <p className="text-secondary text-sm leading-relaxed">
            Visualisasi pemetaan lahan secara real-time. Untuk menjaga privasi, informasi detail almarhum hanya dapat diakses melalui akun keluarga terdaftar.
          </p>
        </div>

        {/* Map Visualization */}
        <div className="w-full aspect-video md:aspect-[21/9] bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 relative overflow-hidden">
          <div className="w-full h-full bg-secondary/5 rounded-[2rem] border border-slate-200 overflow-hidden relative shadow-inner">
            {/* Status Legend */}
            <div className="absolute top-8 left-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-100 z-10 flex gap-6">
              <LegendItem color="bg-rose-500" label="Terisi (Privasi)" />
              <LegendItem color="bg-amber-500" label="Dipesan" />
              <LegendItem color="bg-emerald-500" label="Tersedia" />
            </div>

            {/* Grid Layout (Simulated Map) */}
            <div className="absolute inset-0 flex items-center justify-center p-12 overflow-auto">
              <div className="grid grid-cols-10 md:grid-cols-20 gap-2 min-w-max h-full p-4">
                {graves.map((grave, idx) => (
                  <div 
                    key={idx} 
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-md border-b-2 transition-all cursor-help ${
                      grave.status === 'AVAILABLE' ? 'bg-emerald-500/20 border-emerald-500' :
                      grave.status === 'OCCUPIED' ? 'bg-rose-500/20 border-rose-500' :
                      'bg-amber-500/20 border-amber-500'
                    }`}
                    title={`Blok ${grave.blok} No ${grave.nomor} - ${grave.status === 'OCCUPIED' ? 'Lokasi Terisi' : 'Lokasi ' + grave.status}`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Navigation Overlay */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2">
              <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Geser untuk eksplorasi peta
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
          <p className="text-sm font-medium text-slate-600">Mencari makam keluarga Anda?</p>
          <a 
            href="/auth/login" 
            className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-all"
          >
            Login untuk Lihat Detail Lokasi
          </a>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
  );
}

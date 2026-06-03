import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Send, User, FileText } from "lucide-react";
import { EmptyField } from "./empty-field";

export interface TimelineEvent {
  id: string;
  type: "created" | "submitted" | "approved" | "rejected" | "revision_requested" | "revised" | "note_added" | "info";
  title: string;
  description?: string | null;
  timestamp: string;
  actor?: string | null;
}

interface TimelineWidgetProps {
  events: TimelineEvent[];
}

const eventConfig: Record<string, { icon: React.ReactNode; bg: string; iconBg: string }> = {
  created: {
    icon: <FileText size={14} />,
    bg: "bg-slate-100 border-slate-300",
    iconBg: "bg-slate-400",
  },
  submitted: {
    icon: <Send size={14} />,
    bg: "bg-blue-100 border-blue-300",
    iconBg: "bg-blue-500",
  },
  approved: {
    icon: <CheckCircle size={14} />,
    bg: "bg-emerald-100 border-emerald-300",
    iconBg: "bg-emerald-500",
  },
  rejected: {
    icon: <XCircle size={14} />,
    bg: "bg-red-100 border-red-300",
    iconBg: "bg-red-500",
  },
  revision_requested: {
    icon: <AlertCircle size={14} />,
    bg: "bg-amber-100 border-amber-300",
    iconBg: "bg-amber-500",
  },
  revised: {
    icon: <RefreshCw size={14} />,
    bg: "bg-amber-100 border-amber-300",
    iconBg: "bg-amber-500",
  },
  note_added: {
    icon: <FileText size={14} />,
    bg: "bg-slate-100 border-slate-300",
    iconBg: "bg-slate-400",
  },
  info: {
    icon: <FileText size={14} />,
    bg: "bg-slate-100 border-slate-300",
    iconBg: "bg-slate-400",
  },
};

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: dateStr, time: "" };
  }
}

export function TimelineWidget({ events }: TimelineWidgetProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-manrope">Riwayat Aktivitas</h3>
              <p className="text-xs text-slate-400 font-medium">Belum ada riwayat tersedia</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">Data riwayat akan muncul di sini</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-manrope">Riwayat Aktivitas</h3>
            <p className="text-xs text-slate-400 font-medium">Siklus hidup pengajuan</p>
          </div>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-0">
            {events.map((event, index) => {
              const config = eventConfig[event.type] || eventConfig.info;
              const { date, time } = formatDateTime(event.timestamp);
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${config.bg}`}>
                      <div className={config.iconBg}>
                        {config.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{date}</p>
                        {time && <p className="text-[10px] text-slate-400">{time}</p>}
                      </div>
                    </div>
                    {event.actor && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                        <User size={10} />
                        <span>{event.actor}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

import { ApplicationSummary } from "@/components/admin/pengajuan-detail/application-summary";
import { ApplicantInfo } from "@/components/admin/pengajuan-detail/applicant-info";
import { DeceasedInfo } from "@/components/admin/pengajuan-detail/deceased-info";
import { VerificationPanel } from "@/components/admin/pengajuan-detail/verification-panel";
import { DocumentCard } from "@/components/admin/pengajuan-detail/document-card";
import { GraveAllocation } from "@/components/admin/pengajuan-detail/grave-allocation";
import { TimelineWidget } from "@/components/admin/pengajuan-detail/timeline-widget";
import type { TimelineEvent } from "@/components/admin/pengajuan-detail/timeline-widget";

interface Dokumen {
  id: string;
  type: string;
  file_url: string;
  file_key: string;
  created_at?: string;
}

interface Makam {
  id: string;
  deceased_name: string | null;
  deceased_date: string | null;
  nik: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  relationship: string | null;
  blok: string | null;
  nomor: string | null;
  status: string | null;
  created_at?: string;
}

interface Pengajuan {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  user_id: string;
  profiles?: {
    email: string | null;
    full_name: string | null;
    phone?: string | null;
  };
  makam?: Makam | Makam[];
  dokumen?: Dokumen[];
}

interface Props {
  params: Promise<{ id: string }>;
}

function buildTimelineEvents(pengajuan: Pengajuan): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date().toISOString();

  events.push({
    id: "created",
    type: "created",
    title: "Pengajuan Dibuat",
    description: "Pengajuan baru masuk ke sistem",
    timestamp: pengajuan.created_at || now,
  });

  if (pengajuan.status === "APPROVED") {
    events.push({
      id: "approved",
      type: "approved",
      title: "Pengajuan Disetujui",
      description: pengajuan.notes || "Dokumen telah diverifikasi dan disetujui oleh admin",
      timestamp: pengajuan.updated_at || now,
      actor: "Admin",
    });
  }

  if (pengajuan.status === "REJECTED") {
    events.push({
      id: "rejected",
      type: "rejected",
      title: "Pengajuan Ditolak",
      description: pengajuan.notes || "Pengajuan ditolak oleh admin",
      timestamp: pengajuan.updated_at || now,
      actor: "Admin",
    });
  }

  if (pengajuan.status === "REVISION" || pengajuan.status === "NEED_REVISION") {
    events.push({
      id: "revision_requested",
      type: "revision_requested",
      title: "Revisi Dokumen Diminta",
      description: pengajuan.notes || "Admin meminta perbaikan dokumen",
      timestamp: pengajuan.updated_at || now,
      actor: "Admin",
    });
  }

  if (pengajuan.notes && !["APPROVED", "REJECTED", "REVISION", "NEED_REVISION"].includes(pengajuan.status)) {
    events.push({
      id: "note",
      type: "note_added",
      title: "Catatan Ditambahkan",
      description: pengajuan.notes,
      timestamp: pengajuan.updated_at || now,
      actor: "Admin",
    });
  }

  return events.reverse();
}

export default function PengajuanDetailPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null);
  const [id, setId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async (pengajuanId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("pengajuan")
        .select("*, profiles(email, full_name, phone), makam(*), dokumen(*)")
        .eq("id", pengajuanId);

      if (fetchError) {
        setError(fetchError.message);
      } else if (data && data.length > 0) {
        setPengajuan(data[0]);
      } else {
        setError("Pengajuan tidak ditemukan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchData(p.id);
    });
  }, [params, fetchData]);

  const getPresignedUrl = useCallback(async (fileKey: string) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(fileKey, 300);
    return data?.signedUrl || "";
  }, [supabase.storage]);

  const updateStatus = useCallback(async (newStatus: string, notes: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/pengajuan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      await fetchData(id);
    } finally {
      setUpdating(false);
    }
  }, [id, fetchData]);

  const handleApprove = useCallback(async () => {
    await updateStatus("APPROVED", "Dokumen diverifikasi dan disetujui");
  }, [updateStatus]);

  const handleReject = useCallback(async () => {
    await updateStatus("REJECTED", "Dokumen tidak valid");
  }, [updateStatus]);

  const handleRevision = useCallback(async (note: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/pengajuan/${id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionNote: note }),
      });
      if (!res.ok) throw new Error("Gagal mengirim permintaan revisi");
      await fetchData(id);
    } finally {
      setUpdating(false);
    }
  }, [id, fetchData]);

  const handleAllocate = useCallback(async (blok: string, nomor: string) => {
    await updateStatus(pengajuan?.status || "PENDING", "");
    const { error: updateError } = await supabase
      .from("makam")
      .update({ blok, nomor, status: "RESERVED" })
      .eq("pengajuan_id", id);
    if (updateError) throw updateError;
  }, [id, pengajuan?.status, supabase, updateStatus]);

  const handleRefresh = useCallback(() => {
    return fetchData(id);
  }, [id, fetchData]);

  // Normalize makam data (could be array or single)
  const makamData: Makam | null = Array.isArray(pengajuan?.makam)
    ? (pengajuan?.makam as Makam[])?.[0] || null
    : (pengajuan?.makam as Makam) || null;

  const documents = pengajuan?.dokumen || [];
  const timelineEvents = pengajuan ? buildTimelineEvents(pengajuan) : [];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-slate-400 font-medium">Memuat data pengajuan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pengajuan) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] p-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 max-w-lg text-center">
          <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="text-red-500" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Gagal Memuat Data</h2>
          <p className="text-slate-500 mb-8">{error || "Pengajuan tidak ditemukan"}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => fetchData(id)}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Coba Lagi
            </button>
            <Link
              href="/dashboard/admin/pengajuan"
              className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-neutral transition-all"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/pengajuan"
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-bold">Kembali</span>
        </Link>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FileText size={16} />
          <span className="font-medium">Detail Pengajuan</span>
        </div>
      </div>

      {/* Application Summary Header */}
      <ApplicationSummary
        id={pengajuan.id}
        applicantName={makamData?.applicant_name || pengajuan.profiles?.full_name || null}
        status={pengajuan.status}
        documentCount={documents.length}
        createdAt={pengajuan.created_at}
        updatedAt={pengajuan.updated_at}
      />

      {/* Main Grid — 2 columns on large screens */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column — Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <ApplicantInfo
            fullName={pengajuan.profiles?.full_name || null}
            email={pengajuan.profiles?.email || null}
            phone={pengajuan.profiles?.phone || null}
            role="USER"
            applicantName={makamData?.applicant_name || null}
            applicantPhone={makamData?.applicant_phone || null}
          />

          {/* Deceased Info */}
          <DeceasedInfo
            deceasedName={makamData?.deceased_name || null}
            nik={makamData?.nik || null}
            deceasedDate={makamData?.deceased_date || null}
            relationship={makamData?.relationship || null}
            applicantName={makamData?.applicant_name || null}
            applicantPhone={makamData?.applicant_phone || null}
            blok={makamData?.blok || null}
            nomor={makamData?.nomor || null}
          />

          {/* Grave Allocation */}
          <GraveAllocation
            pengajuanId={pengajuan.id}
            currentBlok={makamData?.blok || null}
            currentNomor={makamData?.nomor || null}
            graveStatus={makamData?.status || null}
            pengajuanStatus={pengajuan.status}
            onAllocate={handleAllocate}
            onRefresh={handleRefresh}
          />

          {/* Documents Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileText className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 font-manrope">Dokumen Persyaratan</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Dokumen yang telah diupload oleh pemohon
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {documents.length} file
                </span>
              </div>

              {documents.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      type={doc.type}
                      fileUrl={doc.file_url}
                      fileKey={doc.file_key}
                      createdAt={doc.created_at}
                      onView={getPresignedUrl}
                      verificationStatus={pengajuan.status === "APPROVED" ? "verified" : "uploaded"}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 bg-neutral/50 rounded-xl border border-dashed border-slate-200">
                  <FileText size={40} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">Belum ada dokumen yang diupload</p>
                  <p className="text-xs mt-1">Dokumen akan muncul setelah pemohon melengkapi pengajuan</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <TimelineWidget events={timelineEvents} />
        </div>

        {/* Right Column — Verification Panel */}
        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <VerificationPanel
              pengajuanId={pengajuan.id}
              currentStatus={pengajuan.status}
              notes={pengajuan.notes}
              createdAt={pengajuan.created_at}
              updatedAt={pengajuan.updated_at}
              documentCount={documents.length}
              onApprove={handleApprove}
              onRequestRevision={handleRevision}
              onReject={handleReject}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>

      {/* Loading overlay during status updates */}
      {updating && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 flex items-center gap-4">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-sm font-bold text-slate-700">Memperbarui status pengajuan...</span>
          </div>
        </div>
      )}
    </div>
  );
}

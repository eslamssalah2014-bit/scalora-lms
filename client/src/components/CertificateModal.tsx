import React from 'react';
import { Modal } from './Modal';
import { Award, Download, Printer, CheckCircle2, Shield } from 'lucide-react';

interface CertificateData {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructor: string;
  completionDate: string;
  verificationUrl: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!certificate) return null;

  const formattedDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Certificate of Completion" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Certificate Frame */}
        <div
          id="certificate-print-area"
          className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-b from-[#061D3D] via-[#082B5B] to-[#04152D] border-4 border-scalora-blue/40 shadow-2xl text-center overflow-hidden"
        >
          {/* Decorative Corner Borders */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-scalora-accent/60" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-scalora-accent/60" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-scalora-accent/60" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-scalora-accent/60" />

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scalora-blue/20 border border-scalora-blue/40 text-xs font-bold uppercase tracking-widest text-scalora-accent mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified Credential</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide uppercase font-serif">
                Certificate of Completion
              </h2>
              <p className="text-xs text-scalora-blue/90 uppercase tracking-widest font-semibold">
                Scalora Engineering & Technology Academy
              </p>
            </div>

            {/* Recipient */}
            <div className="space-y-2 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">This is proudly presented to</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-scalora-accent">
                {certificate.studentName}
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
                for demonstrating exceptional proficiency and successfully mastering all curriculum
                standards and practical assessments in
              </p>
            </div>

            {/* Course Title */}
            <div className="p-4 rounded-xl bg-scalora-navy/50 border border-scalora-blue/30 max-w-xl mx-auto">
              <h4 className="text-lg md:text-xl font-black text-scalora-accent leading-snug">
                {certificate.courseTitle}
              </h4>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end border-t border-scalora-blue/20">
              {/* Instructor */}
              <div className="text-left md:text-center space-y-1">
                <div className="font-serif italic text-base text-slate-200">{certificate.instructor}</div>
                <div className="h-0.5 w-32 bg-slate-500 mx-auto" />
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lead Instructor</p>
              </div>

              {/* Scalora Gold Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-0.5 shadow-lg flex items-center justify-center animate-pulse">
                  <div className="w-full h-full rounded-full bg-[#082B5B] flex flex-col items-center justify-center border border-amber-300/40">
                    <Award className="w-6 h-6 text-amber-300" />
                    <span className="text-[8px] font-black text-amber-200 uppercase tracking-tighter">Scalora</span>
                  </div>
                </div>
                <span className="text-[9px] text-amber-300 font-bold uppercase tracking-widest mt-1">Official Seal</span>
              </div>

              {/* Date & ID */}
              <div className="text-right md:text-center space-y-1">
                <div className="text-xs font-semibold text-slate-200">{formattedDate}</div>
                <div className="h-0.5 w-32 bg-slate-500 mx-auto" />
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Date of Award</p>
              </div>
            </div>

            {/* Verification Code */}
            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-center gap-2">
              <span>Credential ID: <strong className="text-slate-200 font-mono">{certificate.certificateId}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Digitally Signed
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-slate-300 text-xs font-semibold border border-scalora-blue/20 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

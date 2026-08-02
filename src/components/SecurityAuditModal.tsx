import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  UserCheck, 
  Trash2, 
  KeyRound, 
  Eye, 
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const { role, auditLogs, clearAuditLogs, getSavedCredentials } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'DENIED' | 'WARN'>('ALL');

  const creds = getSavedCredentials();

  const filteredLogs = auditLogs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 bg-[#2B2D2F] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl text-[#FF6B00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Terminal Security & RLS Audit Logs
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RLS ACTIVE
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Real-time tracking of login events, access attempts, and role permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Overview Bar */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-medium block uppercase">Active RLS Role</span>
            <span className={`font-black text-sm flex items-center gap-1 mt-0.5 ${role === 'Owner' ? 'text-[#FF6B00]' : 'text-emerald-400'}`}>
              {role === 'Owner' ? '👑 Admin (Owner)' : '👷 Helper (Staff)'}
            </span>
          </div>

          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-medium block uppercase">Admin ID</span>
            <span className="font-mono font-bold text-white text-xs mt-0.5 block">admin / {creds.adminPass}</span>
          </div>

          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-medium block uppercase">Helper ID</span>
            <span className="font-mono font-bold text-white text-xs mt-0.5 block">helper / {creds.helperPass}</span>
          </div>

          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-medium block uppercase">Security Events</span>
            <span className="font-black text-white text-sm mt-0.5 block">{auditLogs.length} Logged</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'SUCCESS', 'DENIED', 'WARN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === st
                    ? 'bg-[#FF6B00] text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={clearAuditLogs}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FileCheck className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-bold text-zinc-300">No Security Audit Logs Found</p>
              <p className="text-xs text-zinc-500 mt-1">Actions and login events will be logged here automatically.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-zinc-950/60 border border-zinc-800/90 rounded-2xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {log.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {log.status === 'DENIED' && <XCircle className="w-4 h-4 text-red-400" />}
                    {log.status === 'WARN' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{log.event}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                        log.role === 'Owner' ? 'bg-orange-950 text-orange-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {log.role}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono block">{log.timestamp}</span>
                  <span className="text-[9px] text-zinc-600 font-mono block">{log.userId}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#2B2D2F] border-t border-zinc-800 text-center text-xs text-zinc-400 shrink-0">
          Sri Balaji Hardware POS • Encrypted Session & Row-Level Authorization
        </div>
      </motion.div>
    </div>
  );
};

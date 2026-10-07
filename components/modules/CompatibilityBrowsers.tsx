"use client";

import React, { useState } from "react";
import { Monitor, CheckCircle2, XCircle, Plus, X } from "lucide-react";
import { useQAStore } from "@/lib/store";

const COLORS = {
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#D97706",
  accent: "#4F46E5",
};

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: COLORS.sub }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Monitor size={14} color={tone} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: COLORS.ink }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: COLORS.sub }}>{sub}</div>
    </div>
  );
}

export function CompatibilityBrowsers() {
  const { browsers, compat, addBrowser } = useQAStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const passCount = browsers.filter((b) => b.status === "Pass").length;
  const failCount = browsers.filter((b) => b.status === "Fail").length;

  return (
    <div className="space-y-6">
      {/* Platform & Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tested Browsers"
          value={String(browsers.length)}
          sub={`${passCount} Passing · ${failCount} Failing`}
          tone={COLORS.accent}
        />
        <StatCard
          label="Passing Rate"
          value={browsers.length > 0 ? `${Math.round((passCount / browsers.length) * 100)}%` : "100%"}
          sub="Engine compatibility score"
          tone={COLORS.green}
        />
        {compat.slice(0, 2).map((c) => (
          <StatCard
            key={c.platform}
            label={c.platform}
            value={`${c.working}/${c.total}`}
            sub={c.working === c.total ? "All features working" : `${c.total - c.working} not working`}
            tone={c.working === c.total ? COLORS.green : COLORS.amber}
          />
        ))}
      </div>

      {/* Cross-Browser Table */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Cross-Browser Compatibility Matrix</div>
            <div className="text-xs" style={{ color: COLORS.sub }}>Rendering and functional checks across tested browsers & engines</div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ background: COLORS.accent }}
          >
            <Plus size={14} />
            Add Browser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.border}` }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Browser</th>
                <th className="px-4 py-3 font-semibold">Rendering Engine</th>
                <th className="px-4 py-3 font-semibold">Tested Version</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {browsers.map((b) => (
                <tr key={`${b.browser}-${b.version}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium" style={{ color: COLORS.ink }}>{b.browser}</td>
                  <td className="px-4 py-3 font-mono text-[11px]" style={{ color: COLORS.sub }}>{b.engine}</td>
                  <td className="px-4 py-3 font-mono text-[11px]" style={{ color: COLORS.sub }}>{b.version}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{
                        background: (b.status === "Pass" ? COLORS.green : COLORS.red) + "1E",
                        color: b.status === "Pass" ? COLORS.green : COLORS.red,
                      }}
                    >
                      {b.status === "Pass" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: b.remark ? COLORS.red : COLORS.sub }}>
                    {b.remark || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Browser Modal */}
      {showAddModal && (
        <AddBrowserModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addBrowser(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddBrowserModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { browser: string; engine: string; version: string; status: "Pass" | "Fail"; remark?: string }) => Promise<void>;
}) {
  const [browser, setBrowser] = useState("");
  const [engine, setEngine] = useState("Blink");
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<"Pass" | "Fail">("Pass");
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!browser.trim() || !version.trim()) {
      setError("Please provide browser name and version.");
      return;
    }
    setBusy(true);
    try {
      await onAdd({
        browser: browser.trim(),
        engine: engine.trim(),
        version: version.trim(),
        status,
        remark: remark.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to add browser record");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl p-5 shadow-2xl" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor size={17} color={COLORS.accent} />
            <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>Add Browser Compatibility Record</span>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 rounded hover:bg-slate-100">
            <X size={16} color={COLORS.sub} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>Browser Name *</label>
            <input
              required
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              placeholder="e.g. Google Chrome, Brave, Arc"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>Rendering Engine *</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                <option value="Blink">Blink (Chrome, Edge, Opera)</option>
                <option value="WebKit">WebKit (Safari)</option>
                <option value="Gecko">Gecko (Firefox)</option>
                <option value="Chromium">Chromium</option>
              </select>
            </div>

            <div>
              <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>Tested Version *</label>
              <input
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 150.0.1"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>Test Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Pass" | "Fail")}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              <option value="Pass">Pass — Fully Compatible</option>
              <option value="Fail">Fail — Layout / Functional Issues</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1 font-medium" style={{ color: COLORS.sub }}>Remarks / Observations</label>
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. All pages render cleanly without shifts"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: COLORS.red + "14", border: `1px solid ${COLORS.red}44`, color: COLORS.red }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
            <button type="button" disabled={busy} onClick={onClose} className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100" style={{ color: COLORS.sub }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm"
              style={{ background: COLORS.accent, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Adding…" : "Add Browser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompatibilityBrowsers;

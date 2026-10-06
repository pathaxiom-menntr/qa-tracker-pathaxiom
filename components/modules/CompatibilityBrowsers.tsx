"use client";

import React from "react";
import { Monitor, CheckCircle2, XCircle } from "lucide-react";
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
};

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: COLORS.sub }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone + "1E" }}>
          <Monitor size={14} color={tone} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: COLORS.ink }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: COLORS.sub }}>{sub}</div>
    </div>
  );
}

export function CompatibilityBrowsers() {
  const { browsers, compat } = useQAStore();

  return (
    <div className="space-y-6">
      {compat.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {compat.map((c) => (
            <StatCard
              key={c.platform}
              label={c.platform}
              value={`${c.working}/${c.total}`}
              sub={c.working === c.total ? "All features working" : `${c.total - c.working} not working`}
              tone={c.working === c.total ? COLORS.green : COLORS.amber}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Desktop Cross-Browser Matrix</div>
            <div className="text-xs" style={{ color: COLORS.sub }}>Rendering and functional checks across 10 modern browser engines</div>
          </div>
        </div>

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
              <tr key={b.browser} className="hover:bg-slate-50">
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
  );
}

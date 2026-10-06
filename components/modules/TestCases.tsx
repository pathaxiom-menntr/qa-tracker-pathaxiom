"use client";

import React, { useState } from "react";
import { ListChecks, Plus, X, Trash2, Loader2 } from "lucide-react";
import { useQAStore } from "@/lib/store";
import { Portal } from "@/lib/types";

const COLORS = {
  panel: "#FFFFFF",
  panel2: "#F1F4F8",
  border: "#E2E6ED",
  ink: "#1A2233",
  sub: "#6B7480",
  accent: "#6C5CE7",
  teal: "#0D9488",
  sky: "#0284C7",
};

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: color + "1E", color }}
    >
      {children}
    </span>
  );
}

function RunStrip({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
      ))}
    </div>
  );
}

export function TestCases() {
  const { portals, createPortal, deletePortal } = useQAStore();
  const [portal, setPortal] = useState("All");
  const [showAddPortal, setShowAddPortal] = useState(false);
  const [newPortalName, setNewPortalName] = useState("");
  const [addError, setAddError] = useState("");

  const handleAddPortal = () => {
    const name = newPortalName.trim();
    if (!name) {
      setAddError("Please enter a portal name.");
      return;
    }
    if (portals.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setAddError("This portal already exists.");
      return;
    }
    createPortal(name);
    setPortal(name);
    setNewPortalName("");
    setShowAddPortal(false);
  };

  const handleDeletePortal = () => {
    if (portal === "All") return;
    const target = portals.find((p) => p.name === portal);
    if (!target) return;
    if (window.confirm(`Are you sure you want to delete "${target.name}"?`)) {
      deletePortal(target.id);
      setPortal("All");
    }
  };

  const filtered = portal === "All" ? portals : portals.filter((p) => p.name === portal);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setPortal("All")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: portal === "All" ? COLORS.accent : COLORS.panel2,
            color: portal === "All" ? "#fff" : COLORS.sub,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          All
        </button>

        {portals.map((p) => (
          <button
            key={p.id}
            onClick={() => setPortal(p.name)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: portal === p.name ? COLORS.accent : COLORS.panel2,
              color: portal === p.name ? "#fff" : COLORS.sub,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {p.name}
          </button>
        ))}

        <button
          onClick={() => {
            setAddError("");
            setNewPortalName("");
            setShowAddPortal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: COLORS.accent, color: "#fff", border: `1px solid ${COLORS.accent}` }}
        >
          <Plus size={14} />
          Add Portal
        </button>

        {portal !== "All" && (
          <button
            onClick={handleDeletePortal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
          >
            <Trash2 size={14} />
            Delete Portal
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <ListChecks size={24} color={COLORS.sub} className="mx-auto mb-2" />
          <div className="text-sm font-medium mb-1">No test case data yet</div>
          <div className="text-xs" style={{ color: COLORS.sub }}>Add a portal or upload a Test Case Report (.xlsx/.csv) in the Reports tab.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{p.name}</span>
                <Badge color={COLORS.accent}>{p.total} cases</Badge>
              </div>

              <RunStrip
                segments={[
                  { label: "Smoke", value: p.smoke, color: COLORS.teal },
                  { label: "Functional", value: p.functional, color: COLORS.accent },
                  { label: "Regression", value: p.regression, color: COLORS.sky },
                ]}
              />

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div>
                  <div className="text-lg font-semibold" style={{ color: COLORS.teal }}>{p.smoke}</div>
                  <div className="text-[10px]" style={{ color: COLORS.sub }}>SMOKE</div>
                </div>
                <div>
                  <div className="text-lg font-semibold" style={{ color: COLORS.accent }}>{p.functional}</div>
                  <div className="text-[10px]" style={{ color: COLORS.sub }}>FUNCTIONAL</div>
                </div>
                <div>
                  <div className="text-lg font-semibold" style={{ color: COLORS.sky }}>{p.regression}</div>
                  <div className="text-[10px]" style={{ color: COLORS.sub }}>REGRESSION</div>
                </div>
              </div>

              {p.passed !== null && p.passed !== undefined && (
                <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${COLORS.border}`, color: COLORS.sub }}>
                  <span>Smoke run: {p.passed} passed</span>
                  <span style={{ color: p.failed && p.failed > 0 ? COLORS.sky : COLORS.teal }}>
                    {p.failed && p.failed > 0 ? `${p.failed} failed` : "0 failed"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddPortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#000000AA" }} onClick={() => setShowAddPortal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Add New Portal</span>
              <button onClick={() => setShowAddPortal(false)} style={{ color: COLORS.sub }}><X size={16} /></button>
            </div>
            {addError && <div className="text-xs p-2.5 rounded-lg mb-3" style={{ background: "#DC262614", color: "#DC2626" }}>{addError}</div>}
            <input
              type="text"
              placeholder="Portal name (e.g. Mobile App)"
              value={newPortalName}
              onChange={(e) => setNewPortalName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-4"
              style={{ background: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddPortal(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: COLORS.sub }}>Cancel</button>
              <button onClick={handleAddPortal} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: COLORS.accent, color: "#fff" }}>Add Portal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

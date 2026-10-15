"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  Image as ImageIcon,
  UploadCloud,
  X,
  Trash2,
  Maximize2,
  Download,
  PenTool,
  Square,
  ArrowRight,
  Type,
  Undo2,
  RotateCcw,
  Check,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { Defect, DefectAttachment } from "@/lib/types";

// ==================== IMAGE COMPRESSION HELPER ====================
// Compress/resize large images to maintain fast rendering and optimal storage
async function processImageFile(file: File): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!file.type.startsWith("image/")) {
        return resolve({ dataUrl, size: file.size });
      }

      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve({ dataUrl, size: file.size });

        ctx.drawImage(img, 0, 0, width, height);
        // Use PNG if original is PNG, else JPEG 0.9
        const isPng = file.type === "image/png";
        const compressed = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.9);
        const approxSize = Math.round((compressed.length * 3) / 4);
        resolve({ dataUrl: compressed, size: approxSize });
      };
      img.onerror = () => resolve({ dataUrl, size: file.size });
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ==================== ATTACHMENT SECTION PROPS ====================
interface DefectAttachmentsSectionProps {
  attachments: DefectAttachment[];
  onChange: (attachments: DefectAttachment[]) => void;
  readOnly?: boolean;
}

export function DefectAttachmentsSection({
  attachments,
  onChange,
  readOnly = false,
}: DefectAttachmentsSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [annotatingItem, setAnnotatingItem] = useState<DefectAttachment | null>(null);
  const [previewItem, setPreviewItem] = useState<DefectAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add files to attachments list
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const newItems: DefectAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { dataUrl, size } = await processImageFile(file);
          const ext = file.name.split(".").pop() || "png";
          const uniqueId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          newItems.push({
            id: uniqueId,
            name: file.name || `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`,
            size,
            type: file.type || "image/png",
            data: dataUrl,
            uploaded_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Error reading file:", err);
        }
      }
      if (newItems.length > 0) {
        onChange([...attachments, ...newItems]);
      }
    },
    [attachments, onChange]
  );

  // Global paste handler for Ctrl+V
  useEffect(() => {
    if (readOnly) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            const now = new Date();
            const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
            const renamed = new File([file], `pasted-screenshot-${timestamp}.png`, {
              type: file.type || "image/png",
            });
            pastedFiles.push(renamed);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        await addFiles(pastedFiles);
        setPasteNotice(`✓ Pasted ${pastedFiles.length} screenshot from clipboard`);
        setTimeout(() => setPasteNotice(null), 3000);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [readOnly, addFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleSaveAnnotation = (annotatedDataUrl: string) => {
    if (!annotatingItem) return;
    const updated = attachments.map((a) => {
      if (a.id === annotatingItem.id) {
        return {
          ...a,
          data: annotatedDataUrl,
          size: Math.round((annotatedDataUrl.length * 3) / 4),
        };
      }
      return a;
    });
    onChange(updated);
    setAnnotatingItem(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Paperclip size={13} className="text-indigo-600" />
          <span>Screenshots &amp; Attachments ({attachments.length})</span>
        </label>
        {!readOnly && (
          <span className="text-[11px] text-slate-400">
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">Ctrl + V</kbd> to paste screenshot
          </span>
        )}
      </div>

      {pasteNotice && (
        <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
          <Sparkles size={12} className="text-emerald-600 shrink-0" />
          <span>{pasteNotice}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/70 scale-[0.99]"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <UploadCloud size={16} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-medium text-slate-700">
              Drag &amp; drop screenshot, or <span className="text-indigo-600 underline">browse files</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports PNG, JPG, GIF, WebP, PDF • You can also directly paste screenshots with Ctrl+V
          </p>
        </div>
      )}

      {/* Attachments List / Thumbnails */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
          {attachments.map((att) => {
            const isImage = att.type.startsWith("image/");
            return (
              <div
                key={att.id}
                className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                {/* Thumbnail / File Header */}
                <div className="relative h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <FileText size={28} className="text-slate-400 mb-1" />
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {att.name.split(".").pop()}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay with Action Buttons */}
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(att)}
                      title="Preview Full Size"
                      className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white hover:text-indigo-600 transition-colors shadow-sm cursor-pointer"
                    >
                      <Eye size={13} />
                    </button>
                    {isImage && !readOnly && (
                      <button
                        type="button"
                        onClick={() => setAnnotatingItem(att)}
                        title="Annotate (Draw Arrows &amp; Red Boxes)"
                        className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <PenTool size={13} />
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(att.id)}
                        title="Remove Attachment"
                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Bar */}
                <div className="p-2 bg-white flex items-center justify-between text-[11px]">
                  <div className="truncate pr-1">
                    <div className="font-medium text-slate-800 truncate" title={att.name}>
                      {att.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{formatBytes(att.size)}</div>
                  </div>
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setAnnotatingItem(att)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 shrink-0 cursor-pointer flex items-center gap-0.5"
                      title="Annotate screenshot"
                    >
                      <PenTool size={10} />
                      <span>Markup</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== ANNOTATOR MODAL ==================== */}
      {annotatingItem && (
        <ImageAnnotatorModal
          attachment={annotatingItem}
          onClose={() => setAnnotatingItem(null)}
          onSave={handleSaveAnnotation}
        />
      )}

      {/* ==================== FULL PREVIEW MODAL ==================== */}
      {previewItem && (
        <AttachmentPreviewModal
          attachment={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}

// ==================== IMAGE ANNOTATOR MODAL ====================
interface ImageAnnotatorModalProps {
  attachment: DefectAttachment;
  onClose: () => void;
  onSave: (annotatedDataUrl: string) => void;
}

type AnnotationTool = "rect" | "arrow" | "text" | "pen";

interface Shape {
  type: AnnotationTool;
  color: string;
  lineWidth: number;
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // arrow
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // text
  text?: string;
  // pen
  points?: { x: number; y: number }[];
}

const COLORS_PALETTE = [
  { name: "Red", hex: "#EF4444" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
];

export function ImageAnnotatorModal({
  attachment,
  onClose,
  onSave,
}: ImageAnnotatorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<AnnotationTool>("rect");
  const [color, setColor] = useState<string>("#EF4444");
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Drawing state
  const isDrawing = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  // Load the image onto an image object
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      setImageLoaded(true);
    };
    img.src = attachment.data;
  }, [attachment.data]);

  // Redraw canvas with base image + all shapes
  const redrawCanvas = useCallback(
    (currentPreviewShape?: Shape) => {
      const canvas = canvasRef.current;
      if (!canvas || !imageObj) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear & redraw background image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

      // Draw all saved shapes
      const allToDraw = currentPreviewShape ? [...shapes, currentPreviewShape] : shapes;

      allToDraw.forEach((shape) => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = shape.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (shape.type === "rect" && shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "arrow" && shape.startX !== undefined && shape.startY !== undefined && shape.endX !== undefined && shape.endY !== undefined) {
          drawArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY, shape.lineWidth);
        } else if (shape.type === "pen" && shape.points && shape.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        } else if (shape.type === "text" && shape.x !== undefined && shape.y !== undefined && shape.text) {
          // Draw text banner with readable background
          const fontSize = Math.max(14, shape.lineWidth * 4);
          ctx.font = `bold ${fontSize}px sans-serif`;
          const textMetrics = ctx.measureText(shape.text);
          const padding = 6;
          const bgWidth = textMetrics.width + padding * 2;
          const bgHeight = fontSize + padding * 2;

          // Draw backdrop
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(shape.x, shape.y - fontSize, bgWidth, bgHeight);

          // Draw text
          ctx.fillStyle = shape.color;
          ctx.fillText(shape.text, shape.x + padding, shape.y + padding);
        }
      });
    },
    [imageObj, shapes]
  );

  // Helper function to draw an arrow with arrowhead
  function drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) {
    const headlen = Math.max(12, width * 3.5);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw main line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // Update canvas sizing once image loads
  useEffect(() => {
    if (imageLoaded && imageObj && canvasRef.current) {
      canvasRef.current.width = imageObj.naturalWidth || 800;
      canvasRef.current.height = imageObj.naturalHeight || 600;
      redrawCanvas();
    }
  }, [imageLoaded, imageObj, redrawCanvas]);

  // Convert mouse event coordinates to canvas scale coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    isDrawing.current = true;
    startPos.current = coords;

    if (tool === "pen") {
      currentPoints.current = [coords];
    } else if (tool === "text") {
      const userText = prompt("Enter bug annotation / text callout:", "Issue here");
      if (userText && userText.trim()) {
        const newShape: Shape = {
          type: "text",
          color,
          lineWidth,
          x: coords.x,
          y: coords.y,
          text: userText.trim(),
        };
        setShapes((prev) => [...prev, newShape]);
      }
      isDrawing.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);

    if (tool === "rect") {
      const width = coords.x - startPos.current.x;
      const height = coords.y - startPos.current.y;
      const preview: Shape = {
        type: "rect",
        color,
        lineWidth,
        x: width < 0 ? coords.x : startPos.current.x,
        y: height < 0 ? coords.y : startPos.current.y,
        width: Math.abs(width),
        height: Math.abs(height),
      };
      redrawCanvas(preview);
    } else if (tool === "arrow") {
      const preview: Shape = {
        type: "arrow",
        color,
        lineWidth,
        startX: startPos.current.x,
        startY: startPos.current.y,
        endX: coords.x,
        endY: coords.y,
      };
      redrawCanvas(preview);
    } else if (tool === "pen") {
      currentPoints.current.push(coords);
      const preview: Shape = {
        type: "pen",
        color,
        lineWidth,
        points: currentPoints.current,
      };
      redrawCanvas(preview);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const coords = getCanvasCoords(e);

    if (tool === "rect") {
      const width = coords.x - startPos.current.x;
      const height = coords.y - startPos.current.y;
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        setShapes((prev) => [
          ...prev,
          {
            type: "rect",
            color,
            lineWidth,
            x: width < 0 ? coords.x : startPos.current.x,
            y: height < 0 ? coords.y : startPos.current.y,
            width: Math.abs(width),
            height: Math.abs(height),
          },
        ]);
      } else {
        redrawCanvas();
      }
    } else if (tool === "arrow") {
      const dist = Math.hypot(coords.x - startPos.current.x, coords.y - startPos.current.y);
      if (dist > 10) {
        setShapes((prev) => [
          ...prev,
          {
            type: "arrow",
            color,
            lineWidth,
            startX: startPos.current.x,
            startY: startPos.current.y,
            endX: coords.x,
            endY: coords.y,
          },
        ]);
      } else {
        redrawCanvas();
      }
    } else if (tool === "pen") {
      if (currentPoints.current.length > 1) {
        setShapes((prev) => [
          ...prev,
          {
            type: "pen",
            color,
            lineWidth,
            points: currentPoints.current,
          },
        ]);
      } else {
        redrawCanvas();
      }
      currentPoints.current = [];
    }
  };

  const handleUndo = () => {
    setShapes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    if (shapes.length > 0 && confirm("Clear all annotations on this screenshot?")) {
      setShapes([]);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export at full resolution
    const annotatedDataUrl = canvas.toDataURL("image/png", 0.95);
    onSave(annotatedDataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-white"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <PenTool size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Annotate Screenshot</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {attachment.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Highlight defect areas with red boxes, arrows, freehand pen, and text callouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Annotation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          {/* Tools selection */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setTool("rect")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                tool === "rect" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Square size={14} />
              <span>Red Box</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("arrow")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                tool === "arrow" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <ArrowRight size={14} />
              <span>Arrow</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("pen")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                tool === "pen" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <PenTool size={14} />
              <span>Pen</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                tool === "text" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Type size={14} />
              <span>Text Callout</span>
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-medium">Color:</span>
            <div className="flex items-center gap-1.5">
              {COLORS_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.name}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    color === c.hex ? "ring-2 ring-indigo-400 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: c.hex }}
                >
                  {color === c.hex && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-medium">Thickness:</span>
            <div className="flex items-center gap-1">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setLineWidth(w)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    lineWidth === w ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {w === 2 ? "Thin" : w === 4 ? "Med" : "Thick"}
                </button>
              ))}
            </div>
          </div>

          {/* Undo & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={shapes.length === 0}
              title="Undo last annotation (Ctrl+Z)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Undo2 size={13} />
              <span>Undo ({shapes.length})</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={shapes.length === 0}
              title="Clear all annotations"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Workspace Viewport */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center min-h-[320px] max-h-[65vh]">
          {!imageLoaded ? (
            <div className="text-slate-500 text-xs flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Loading screenshot…
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border border-slate-800 cursor-crosshair bg-slate-900"
            />
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <span className="text-slate-400 text-[11px]">
            💡 Click and drag on the screenshot to draw. For text callouts, click where you want the label to appear.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Apply &amp; Save Markup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== FULLSCREEN ATTACHMENT PREVIEW MODAL ====================
function AttachmentPreviewModal({
  attachment,
  onClose,
}: {
  attachment: DefectAttachment;
  onClose: () => void;
}) {
  const isImage = attachment.type.startsWith("image/");
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-md">{attachment.name}</h3>
            <p className="text-[11px] text-slate-400">
              {formatBytes(attachment.size)} • Uploaded {new Date(attachment.uploaded_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] text-slate-400 font-mono w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center min-h-[300px]">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.data}
              alt={attachment.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              className="max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-100"
            />
          ) : (
            <div className="text-center p-8">
              <FileText size={48} className="text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white mb-2">{attachment.name}</p>
              <p className="text-xs text-slate-400 mb-4">{formatBytes(attachment.size)}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== DEFECT ATTACHMENTS VIEWER MODAL ====================
export function DefectAttachmentsViewerModal({
  defect,
  onClose,
  onUpdateDefect,
}: {
  defect: Defect;
  onClose: () => void;
  onUpdateDefect?: (id: string, patch: Partial<Defect>) => Promise<void>;
}) {
  const attachments = defect.attachments || [];
  const [selectedAtt, setSelectedAtt] = useState<DefectAttachment | null>(attachments[0] || null);
  const [annotatingItem, setAnnotatingItem] = useState<DefectAttachment | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSaveAnnotation = async (annotatedDataUrl: string) => {
    if (!annotatingItem || !onUpdateDefect) return;
    setSaving(true);
    try {
      const updated = attachments.map((a) => {
        if (a.id === annotatingItem.id) {
          return {
            ...a,
            data: annotatedDataUrl,
            size: Math.round((annotatedDataUrl.length * 3) / 4),
          };
        }
        return a;
      });
      await onUpdateDefect(defect.id, { attachments: updated });
      setAnnotatingItem(null);
      if (selectedAtt?.id === annotatingItem.id) {
        setSelectedAtt({
          ...selectedAtt,
          data: annotatedDataUrl,
          size: Math.round((annotatedDataUrl.length * 3) / 4),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (att: DefectAttachment) => {
    const link = document.createElement("a");
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Paperclip size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600">{defect.id}</span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-md">{defect.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {defect.severity}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {defect.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {defect.project_name || "Assessment Platform"} • Module: {defect.module} • {attachments.length} attached {attachments.length === 1 ? "file" : "files"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area: Left Thumbnails + Right Preview */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-900">
          {/* Left Thumbnails List */}
          <div className="w-64 border-r border-slate-800 bg-slate-950 p-3 overflow-y-auto space-y-2 shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Attached Files ({attachments.length})
            </div>
            {attachments.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">No attachments found</div>
            ) : (
              attachments.map((att) => {
                const isSelected = selectedAtt?.id === att.id;
                const isImg = att.type.startsWith("image/");
                return (
                  <div
                    key={att.id}
                    onClick={() => {
                      setSelectedAtt(att);
                      setZoom(1);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-xs"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/60">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div className="truncate flex-1 text-xs">
                      <div className="font-semibold text-white truncate" title={att.name}>
                        {att.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{formatBytes(att.size)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Main Stage Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {selectedAtt ? (
              <>
                {/* Control bar above preview */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs text-slate-300">
                  <div className="truncate max-w-sm font-medium">
                    {selectedAtt.name} ({formatBytes(selectedAtt.size)})
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAtt.type.startsWith("image/") && (
                      <>
                        <button
                          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Zoom Out"
                        >
                          <ZoomOut size={15} />
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
                        <button
                          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Zoom In"
                        >
                          <ZoomIn size={15} />
                        </button>
                        {onUpdateDefect && (
                          <button
                            onClick={() => setAnnotatingItem(selectedAtt)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                            title="Annotate screenshot (Draw Arrows & Red Boxes)"
                          >
                            <PenTool size={12} />
                            <span>Annotate / Markup</span>
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDownload(selectedAtt)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs cursor-pointer transition-colors"
                      title="Download attachment file"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
                  {selectedAtt.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedAtt.data}
                      alt={selectedAtt.name}
                      style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                      className="max-w-full max-h-[65vh] object-contain rounded-lg transition-transform duration-100"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileText size={56} className="text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-white mb-1">{selectedAtt.name}</p>
                      <p className="text-xs text-slate-400 mb-4">{formatBytes(selectedAtt.size)}</p>
                      <button
                        onClick={() => handleDownload(selectedAtt)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Download File
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                No attachment selected
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white text-xs">
          <span className="text-slate-500 text-[11px]">
            {defect.description ? defect.description : "No defect description provided."}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Annotator */}
      {annotatingItem && (
        <ImageAnnotatorModal
          attachment={annotatingItem}
          onClose={() => setAnnotatingItem(null)}
          onSave={handleSaveAnnotation}
        />
      )}
    </div>
  );
}


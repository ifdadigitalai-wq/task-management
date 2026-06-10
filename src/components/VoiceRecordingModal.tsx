"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Mic, StopCircle, Trash2, Play, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VoiceRecordingModalProps {
  onSave: (blob: Blob, name: string) => void;
  onClose: () => void;
  zIndexBackdrop?: number | string;
  zIndexModal?: number | string;
}

export function VoiceRecordingModal({
  onSave,
  onClose,
  zIndexBackdrop = "var(--z-modal-backdrop)",
  zIndexModal = "var(--z-modal)",
}: VoiceRecordingModalProps) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const display = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  const startTimer = () => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("done");
      };
      mr.start();
      mediaRef.current = mr;
      setState("recording");
      startTimer();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const pauseRecording = () => {
    mediaRef.current?.pause();
    stopTimer();
    setState("paused");
  };
  const resumeRecording = () => {
    mediaRef.current?.resume();
    startTimer();
    setState("recording");
  };
  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    stopTimer();
  };
  const discard = () => {
    setAudioUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setState("idle");
  };

  useEffect(() => () => stopTimer(), []);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center"
        style={{ zIndex: zIndexBackdrop }}
      />

      {/* Modal Container */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] bg-surface border border-border rounded-xl shadow-lg p-6 animate-in zoom-in-95 duration-150"
        style={{ zIndex: zIndexModal }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-text-primary">Voice Recording</span>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded-md text-text-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div
            className={`text-3xl font-medium font-mono tracking-tight ${
              state === "recording" ? "text-priority-critical-text animate-pulse" : "text-text-primary"
            }`}
          >
            {display}
          </div>
          <div className="mt-2 text-[11px] font-medium text-text-tertiary">
            {state === "idle" && "Ready to record"}
            {state === "recording" && "● Recording..."}
            {state === "paused" && "Paused"}
            {state === "done" && "Recording saved"}
          </div>
        </div>

        {/* Waves Animation */}
        {(state === "recording" || state === "paused") && (
          <div className="flex justify-center items-center gap-1 mb-6 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full ${
                  state === "recording" ? "bg-priority-critical-text" : "bg-border-strong"
                }`}
                style={{
                  height: `${6 + Math.abs(Math.sin(i * 0.5) * 16) + Math.cos(i * 0.8) * 8}px`,
                  animation:
                    state === "recording"
                      ? `wave-anim ${1 + (i % 3) * 0.2}s ease-in-out infinite`
                      : "none",
                }}
              />
            ))}
          </div>
        )}

        {state === "done" && audioUrl && (
          <div className="mb-6">
            <audio controls src={audioUrl} className="w-full rounded bg-bg" />
          </div>
        )}

        <div className="flex justify-center gap-3">
          {state === "idle" && (
            <Button onClick={startRecording} variant="danger" size="sm" icon={<Mic className="h-3.5 w-3.5" />}>
              Start Recording
            </Button>
          )}
          {state === "recording" && (
            <>
              <Button onClick={pauseRecording} variant="secondary" size="sm" icon={<Pause className="h-3.5 w-3.5" />}>
                Pause
              </Button>
              <Button onClick={stopRecording} variant="danger" size="sm" icon={<StopCircle className="h-3.5 w-3.5" />}>
                Stop
              </Button>
            </>
          )}
          {state === "paused" && (
            <>
              <Button onClick={resumeRecording} variant="secondary" size="sm" icon={<Play className="h-3.5 w-3.5" />}>
                Resume
              </Button>
              <Button onClick={stopRecording} variant="danger" size="sm" icon={<StopCircle className="h-3.5 w-3.5" />}>
                Stop
              </Button>
            </>
          )}
          {state === "done" && (
            <>
              <Button onClick={discard} variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />}>
                Discard
              </Button>
              <Button
                onClick={() => {
                  if (blobRef.current) {
                    onSave(blobRef.current, `recording-${Date.now()}.webm`);
                    onClose();
                  }
                }}
                variant="primary"
                size="sm"
                icon={<Check className="h-3.5 w-3.5" />}
              >
                Save Note
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

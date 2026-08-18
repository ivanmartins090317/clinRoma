"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { finalizeAudioAttachmentAction } from "@/features/records/actions";
import { AUDIO_MAX_BYTES } from "@/features/records/domain/attachment-limits";
import {
  flushPendingAudioChunks,
  uploadAudioChunk,
} from "@/features/records/lib/upload-audio-chunk";
import {
  normalizeAudioMime,
  pickSupportedAudioMime,
} from "@/features/records/lib/pick-audio-mime";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";

interface AudioRecorderProps {
  patientId: string;
  evolutionId: string;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function detectSupportedAudioMime(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.isSecureContext) {
    return null;
  }

  return pickSupportedAudioMime((type) => MediaRecorder.isTypeSupported(type));
}

function useSupportedAudioMime(): string | null {
  return useSyncExternalStore(
    () => () => {},
    detectSupportedAudioMime,
    () => null,
  );
}

function useSecureContext(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => window.isSecureContext,
    () => false,
  );
}

export function AudioRecorder({ patientId, evolutionId }: AudioRecorderProps) {
  const mimeType = useSupportedAudioMime();
  const isSecureContext = useSecureContext();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundWarning, setBackgroundWarning] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sessionIdRef = useRef(crypto.randomUUID());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const levelFrameRef = useRef<number | null>(null);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && isRecording) {
        setBackgroundWarning(true);
      }
    }

    function handleOnline() {
      if (!mimeType) {
        return;
      }

      void flushPendingAudioChunks({
        sessionId: sessionIdRef.current,
        mimeType,
        maxIndex: chunkIndexRef.current,
        getBlobForIndex: (index) => chunksRef.current[index] ?? null,
      });
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (levelFrameRef.current) {
        window.cancelAnimationFrame(levelFrameRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isRecording, mimeType]);

  async function startRecording() {
    if (!mimeType) {
      setError("Gravação de áudio não suportada neste navegador.");
      return;
    }

    setError(null);
    setBackgroundWarning(false);
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setTotalBytes(0);
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (!event.data.size) {
          return;
        }

        chunksRef.current.push(event.data);
        setTotalBytes((current) => {
          const next = current + event.data.size;

          if (next > AUDIO_MAX_BYTES) {
            setError("Áudio atingiu o limite de 50 MB.");
            stopRecording();
          }

          return next;
        });

        const index = chunkIndexRef.current;
        chunkIndexRef.current += 1;
        setUploading(true);

        const result = await uploadAudioChunk({
          sessionId: sessionIdRef.current,
          chunkIndex: index,
          mimeType,
          blob: event.data,
          totalBytes: totalBytes + event.data.size,
        });

        setUploading(false);

        if (!result.ok) {
          setError(result.error ?? "Falha no envio do bloco");
        }
      };

      recorder.start(3000);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setElapsed((value) => value + 1);
      }, 1000);

      const updateLevel = () => {
        const analyserNode = analyserRef.current;

        if (!analyserNode) {
          return;
        }

        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);
        const average =
          data.reduce((sum, value) => sum + value, 0) / data.length;
        setLevel(Math.min(100, Math.round((average / 255) * 100)));
        levelFrameRef.current = window.requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (recordingError) {
      if (
        recordingError instanceof DOMException &&
        recordingError.name === "NotAllowedError"
      ) {
        setError("Permita o microfone nas configurações do navegador.");
        return;
      }

      setError("Não foi possível iniciar a gravação.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (levelFrameRef.current) {
      window.cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }

    setIsRecording(false);
    setLevel(0);
  }

  function handleFinalize() {
    if (!mimeType || totalBytes <= 0) {
      setError("Grave um áudio antes de finalizar.");
      return;
    }

    startTransition(async () => {
      const result = await finalizeAudioAttachmentAction({
        patientId,
        evolutionId,
        sessionId: sessionIdRef.current,
        mimeType: normalizeAudioMime(mimeType),
        totalBytes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast("Áudio salvo. Transcrição em andamento.");
      sessionIdRef.current = crypto.randomUUID();
      setTotalBytes(0);
    });
  }

  if (!isSecureContext) {
    return (
      <p className="text-sm text-muted-foreground">
        Gravação exige HTTPS. Use <code className="text-xs">npm run dev</code>{" "}
        e acesse via https://localhost:3000.
      </p>
    );
  }

  if (!mimeType) {
    return (
      <p className="text-sm text-muted-foreground">
        Gravação indisponível: formato de áudio não suportado neste navegador.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">Gravação de prescrição</p>
        <p className="font-mono text-sm">{formatElapsed(elapsed)}</p>
      </div>

      <Progress value={level} />

      {backgroundWarning ? (
        <Alert variant="warning">
          <AlertDescription>
            O app foi para segundo plano. A gravação pode ser interrompida no
            iOS; blocos já enviados foram preservados.
          </AlertDescription>
        </Alert>
      ) : null}

      {uploading ? (
        <p className="text-sm text-muted-foreground">Enviando bloco...</p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!isRecording ? (
          <Button
            type="button"
            className="min-h-11 flex-1"
            onClick={startRecording}
          >
            Gravar
          </Button>
        ) : (
          <Button
            type="button"
            className="min-h-11 flex-1 bg-destructive text-white hover:bg-destructive/90"
            onClick={stopRecording}
          >
            Parar
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1"
          disabled={isPending || isRecording || totalBytes <= 0}
          onClick={handleFinalize}
        >
          {isPending ? "Finalizando..." : "Finalizar áudio"}
        </Button>
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { midiToChart } from "@/lib/engine/midi";
import { addImported } from "@/lib/storage/db";

export function MidiDropzone({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const chart = midiToChart(buffer, file.name.replace(/\.midi?$/i, ""));
      await addImported(chart);
      setError(null);
      onImported();
    } catch {
      setError("Could not parse that file. Is it a valid .mid?");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void handle(file);
        }}
        className={
          "rounded-xl border border-dashed px-4 py-6 text-sm transition-colors " +
          (dragging
            ? "border-sky-400 bg-sky-500/10 text-sky-300"
            : "border-zinc-700 text-zinc-400 hover:border-zinc-500")
        }
      >
        Drop a <span className="font-semibold">.mid</span> file here, or click to choose
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

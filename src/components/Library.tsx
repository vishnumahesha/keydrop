"use client";

import { useEffect, useState } from "react";
import type { ChartSong } from "@/types/note";
import { SongCard } from "@/components/SongCard";
import { MidiDropzone } from "@/components/MidiDropzone";
import { listImported, removeImported, getScores } from "@/lib/storage/db";

export function Library({ builtins }: { builtins: ChartSong[] }) {
  const [imported, setImported] = useState<ChartSong[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  const refresh = async () => {
    const [list, sc] = await Promise.all([listImported(), getScores()]);
    setImported(list);
    setScores(sc);
  };

  useEffect(() => {
    Promise.all([listImported(), getScores()]).then(([list, sc]) => {
      setImported(list);
      setScores(sc);
    });
  }, []);

  const remove = async (id: string) => {
    await removeImported(id);
    void refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <MidiDropzone onImported={refresh} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Bundled
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {builtins.map((song) => (
            <SongCard key={song.id} song={song} bestScore={scores[song.id]} />
          ))}
        </div>
      </section>

      {imported.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Imported
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {imported.map((song) => (
              <div key={song.id} className="relative">
                <SongCard song={song} bestScore={scores[song.id]} />
                <button
                  onClick={() => remove(song.id)}
                  aria-label={`Delete ${song.title}`}
                  className="absolute right-2 top-2 rounded bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400 hover:bg-rose-600 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { SONGS } from "@/lib/songs";
import { SongCard } from "@/components/SongCard";
import { ModeSelect } from "@/components/ModeSelect";
import { HandFilter } from "@/components/HandFilter";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Key<span className="text-sky-400">Drop</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Falling-tile piano practice. Pick an input, pick a song, play.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Input mode
        </h2>
        <ModeSelect />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Hands
        </h2>
        <HandFilter />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Songs
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SONGS.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </main>
  );
}

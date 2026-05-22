"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/store/game";

export type MidiStatus = { supported: boolean; devices: string[] };

/**
 * Web MIDI input adapter. Routes note-on/off from any connected device into
 * the game store and auto-rebinds when devices are plugged/unplugged.
 * Chrome/Edge only — `supported` is false elsewhere (notably Safari).
 */
export function useMidiInput(enabled: boolean): MidiStatus {
  const [status, setStatus] = useState<MidiStatus>({ supported: true, devices: [] });

  useEffect(() => {
    if (!enabled) return;

    let access: MIDIAccess | null = null;
    let cancelled = false;

    const onMessage = (e: MIDIMessageEvent) => {
      const data = e.data;
      if (!data || data.length < 2) return;
      const cmd = data[0] & 0xf0;
      const note = data[1];
      const velocity = data[2] ?? 0;
      const { songTime, noteOn, noteOff } = useGame.getState();
      if (cmd === 0x90 && velocity > 0) noteOn(note, songTime);
      else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) noteOff(note, songTime);
    };

    const bind = () => {
      if (!access) return;
      const names: string[] = [];
      access.inputs.forEach((input) => {
        input.onmidimessage = onMessage;
        names.push(input.name ?? "MIDI device");
      });
      setStatus({ supported: true, devices: names });
    };

    Promise.resolve()
      .then(() => {
        if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
          throw new Error("web-midi-unsupported");
        }
        return navigator.requestMIDIAccess({ sysex: false });
      })
      .then((a) => {
        if (cancelled) return;
        access = a;
        a.onstatechange = bind;
        bind();
      })
      .catch(() => {
        if (!cancelled) setStatus({ supported: false, devices: [] });
      });

    return () => {
      cancelled = true;
      if (access) {
        access.onstatechange = null;
        access.inputs.forEach((i) => (i.onmidimessage = null));
      }
    };
  }, [enabled]);

  return status;
}

"use client";

import { useEffect, useState } from "react";

const LINES = [
  "bpm install bur",
  "bur search redis",
  "bur build .",
  "bur submit .",
  "bur publish .",
];

export default function HeroTerminal() {
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const full = LINES[line];
    if (typed.length < full.length) {
      const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 55);
      return () => clearTimeout(t);
    }
    // line finished — hold, then commit and advance
    const t = setTimeout(() => {
      setDone((d) => [...d, full].slice(-3));
      setTyped("");
      setLine((l) => (l + 1) % LINES.length);
    }, 1100);
    return () => clearTimeout(t);
  }, [typed, line]);

  return (
    <div className="term" aria-hidden="true">
      <div className="term-bar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
      </div>
      <div className="term-body">
        {done.map((d, i) => (
          <div key={i}>
            <span className="prompt">$ </span>
            {d}
          </div>
        ))}
        <div>
          <span className="prompt">$ </span>
          {typed}
          <span className="term-cursor" />
        </div>
      </div>
    </div>
  );
}

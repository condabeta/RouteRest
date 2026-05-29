import { useEffect, useRef, useState } from "react";
import { geocodeSuggest } from "../api";

/**
 * Autocomplete location input. Fetches U.S. place suggestions as the user
 * types and lets them pick from a dropdown instead of typing the full string.
 */
export default function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  pinClass,
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipNextFetch = useRef(false);
  const wrapRef = useRef(null);
  const abortRef = useRef(null);

  // Debounced suggestion fetch.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await geocodeSuggest(q, controller.signal);
        setResults(res);
        setActiveIndex(-1);
        if (document.activeElement === wrapRef.current?.querySelector("input")) {
          setOpen(true);
        }
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(handle);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const select = (item) => {
    skipNextFetch.current = true;
    onChange(item.value);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        select(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="field" ref={wrapRef}>
      <label>{label}</label>
      <div className="input-wrap autocomplete">
        <span className={`pin ${pinClass}`} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        {loading && <span className="input-spinner" />}

        {open && results.length > 0 && (
          <ul className="suggestions">
            {results.map((r, i) => (
              <li
                key={`${r.value}-${i}`}
                className={i === activeIndex ? "active" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(r);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <svg
                  className="loc-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="loc-text">
                  <span className="loc-primary">{r.primary}</span>
                  <span className="loc-secondary">{r.secondary}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

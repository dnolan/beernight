"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface BreweryChipInputProps {
  value: string[];
  onChange: (breweries: string[]) => void;
}

export default function BreweryChipInput({
  value,
  onChange,
}: BreweryChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<{ _id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/breweries?q=${encodeURIComponent(q.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          // Filter out already-selected breweries
          setSuggestions(
            data.filter(
              (b: { name: string }) =>
                !value.some((v) => v.toLowerCase() === b.name.toLowerCase())
            )
          );
        }
      } catch {
        /* ignore */
      }
    },
    [value]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim().length > 0) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(inputValue);
        setShowSuggestions(true);
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addBrewery = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIdx(-1);
    inputRef.current?.focus();
  };

  const removeBrewery = (name: string) => {
    onChange(value.filter((v) => v !== name));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
        addBrewery(suggestions[highlightIdx].name);
      } else if (inputValue.trim()) {
        addBrewery(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeBrewery(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const exactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[36px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <Badge
            key={name}
            variant="secondary"
            className="gap-1 pr-1 cursor-default"
          >
            {name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeBrewery(name);
              }}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          placeholder={value.length === 0 ? "e.g. BrewDog" : "Add another..."}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHighlightIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) setShowSuggestions(true);
          }}
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={s._id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                idx === highlightIdx ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                addBrewery(s.name);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              {s.name}
            </button>
          ))}
          {inputValue.trim() && !exactMatch && (
            <button
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent text-muted-foreground italic ${
                highlightIdx === suggestions.length ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                addBrewery(inputValue);
              }}
            >
              Add &quot;{inputValue.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";

interface BreweryChipInputProps {
  value: string[];
  onChange: (breweries: string[]) => void;
}

export default function BreweryChipInput({
  value,
  onChange,
}: BreweryChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setOptions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/breweries?q=${encodeURIComponent(q.trim())}`
        );
        if (res.ok) {
          const data: { _id: string; name: string }[] = await res.json();
          setOptions(
            data
              .map((b) => b.name)
              .filter(
                (name) =>
                  !value.some((v) => v.toLowerCase() === name.toLowerCase())
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
      debounceRef.current = setTimeout(() => fetchSuggestions(inputValue), 200);
    } else {
      setOptions([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, fetchSuggestions]);

  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      value={value}
      inputValue={inputValue}
      onInputChange={(_e, newInput) => setInputValue(newInput)}
      onChange={(_e, newValue) => {
        onChange(newValue.map((v) => (typeof v === "string" ? v : v)));
        setInputValue("");
      }}
      options={options}
      filterOptions={(opts, params) => {
        const filtered = opts.filter((o) =>
          o.toLowerCase().includes(params.inputValue.toLowerCase())
        );
        const inputTrimmed = params.inputValue.trim();
        if (
          inputTrimmed &&
          !filtered.some(
            (o) => o.toLowerCase() === inputTrimmed.toLowerCase()
          ) &&
          !value.some(
            (v) => v.toLowerCase() === inputTrimmed.toLowerCase()
          )
        ) {
          filtered.push(inputTrimmed);
        }
        return filtered;
      }}
      getOptionLabel={(option) => option}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });
          return <Chip key={key} label={option} size="small" {...rest} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length === 0 ? "e.g. BrewDog" : "Add another..."}
        />
      )}
    />
  );
}

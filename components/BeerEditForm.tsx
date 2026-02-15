"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import BreweryChipInput from "@/components/BreweryChipInput";

interface BeerEditFormProps {
  beer: {
    _id: string;
    eventId: string;
    name: string;
    brewery: string;
    breweries?: string[];
    style: string;
    abv: number;
  };
  onCancel: () => void;
}

export default function BeerEditForm({ beer, onCancel }: BeerEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(beer.name);
  const [breweries, setBreweries] = useState<string[]>(
    beer.breweries && beer.breweries.length > 0
      ? beer.breweries
      : beer.brewery
        ? [beer.brewery]
        : []
  );
  const [style, setStyle] = useState(beer.style || "");
  const [abv, setAbv] = useState(beer.abv ? String(beer.abv) : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `/api/events/${beer.eventId}/beers/${beer._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, breweries, style, abv }),
        }
      );

      if (res.ok) {
        onCancel();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Name"
            placeholder="e.g. Punk IPA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            size="small"
            fullWidth
          />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Breweries
          </Typography>
          <BreweryChipInput value={breweries} onChange={setBreweries} />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Style"
            placeholder="e.g. IPA"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="ABV %"
            type="number"
            slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
            placeholder="e.g. 5.6"
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !name}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Add } from "@mui/icons-material";
import BreweryChipInput from "@/components/BreweryChipInput";

interface BeerFormProps {
  eventId: string;
}

export default function BeerForm({ eventId }: BeerFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [breweries, setBreweries] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [abv, setAbv] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/beers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, breweries, style, abv }),
      });

      if (res.ok) {
        setName("");
        setBreweries([]);
        setStyle("");
        setAbv("");
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outlined"
        fullWidth
        startIcon={<Add />}
      >
        Add Beer
      </Button>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}
    >
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !name}>
            {loading ? "Adding..." : "Add Beer"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

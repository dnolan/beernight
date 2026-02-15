"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
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
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Beer
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="beer-name">Name *</Label>
          <Input
            id="beer-name"
            placeholder="e.g. Punk IPA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Breweries</Label>
          <BreweryChipInput value={breweries} onChange={setBreweries} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beer-style">Style</Label>
          <Input
            id="beer-style"
            placeholder="e.g. IPA"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beer-abv">ABV %</Label>
          <Input
            id="beer-abv"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 5.6"
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name}>
          {loading ? "Adding..." : "Add Beer"}
        </Button>
      </div>
    </form>
  );
}

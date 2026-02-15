"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-name-${beer._id}`}>Name *</Label>
          <Input
            id={`edit-name-${beer._id}`}
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
          <Label htmlFor={`edit-style-${beer._id}`}>Style</Label>
          <Input
            id={`edit-style-${beer._id}`}
            placeholder="e.g. IPA"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-abv-${beer._id}`}>ABV %</Label>
          <Input
            id={`edit-abv-${beer._id}`}
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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

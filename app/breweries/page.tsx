"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { SportsBar } from "@mui/icons-material";

interface BeerEntry {
  _id: string;
  name: string;
  style: string;
  abv: number;
  avgRating: number;
  reviewCount: number;
  eventTitle: string;
  eventId: string;
}

interface BreweryGroup {
  name: string;
  beerCount: number;
  beers: BeerEntry[];
}

export default function BreweriesPage() {
  const { data: session } = useSession();
  const [breweries, setBreweries] = useState<BreweryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/breweries/all")
      .then((res) => res.json())
      .then((data) => {
        setBreweries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) return null;

  const totalBreweries = breweries.length;
  const totalBeers = breweries.reduce((s, b) => s + b.beerCount, 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" fontWeight={700}>
          Breweries
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`${totalBreweries} breweries`} variant="outlined" size="small" />
          <Chip
            icon={<SportsBar sx={{ fontSize: 16 }} />}
            label={`${totalBeers} beers`}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} />
          ))}
        </Stack>
      ) : breweries.length === 0 ? (
        <Typography color="text.secondary">
          No breweries yet. Add beers to events to see them here!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {breweries.map((brewery) => (
            <Card key={brewery.name}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {brewery.name}
                  </Typography>
                  <Chip
                    label={`${brewery.beerCount} beer${brewery.beerCount !== 1 ? "s" : ""}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Stack spacing={1}>
                  {brewery.beers.map((beer) => (
                    <Box
                      key={beer._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="body1" fontWeight={500}>
                            {beer.name}
                          </Typography>
                          {beer.abv > 0 && (
                            <Chip
                              label={`${beer.abv}%`}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: "monospace", fontSize: 12 }}
                            />
                          )}
                          {beer.style && (
                            <Typography variant="body2" color="text.secondary">
                              {beer.style}
                            </Typography>
                          )}
                        </Box>
                        <Link href={`/events/${beer.eventId}`}>
                          <Typography
                            variant="caption"
                            color="primary"
                            sx={{ "&:hover": { textDecoration: "underline" } }}
                          >
                            {beer.eventTitle}
                          </Typography>
                        </Link>
                      </Box>
                      {beer.reviewCount > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                          <Rating value={beer.avgRating} readOnly size="small" precision={0.1} />
                          <Typography variant="body2" color="text.secondary">
                            {beer.avgRating}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

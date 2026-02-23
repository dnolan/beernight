"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { SportsBar, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { getRatingColor } from "@/lib/utils";
import BreweryImageUpload from "@/components/BreweryImageUpload";

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

interface BrewerySummary {
  name: string;
  imageUrl: string;
  beerCount: number;
  avgRating: number;
}

export default function BreweriesPage() {
  const { data: session } = useSession();
  const [breweries, setBreweries] = useState<BrewerySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [beersCache, setBeersCache] = useState<Map<string, BeerEntry[]>>(new Map());
  const [loadingBeers, setLoadingBeers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/breweries/all")
      .then((res) => res.json())
      .then((data) => {
        setBreweries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchBeers = useCallback(async (breweryName: string) => {
    if (beersCache.has(breweryName)) return;

    setLoadingBeers((prev) => new Set(prev).add(breweryName));
    try {
      const res = await fetch(
        `/api/breweries/${encodeURIComponent(breweryName)}/beers`
      );
      const data: BeerEntry[] = await res.json();
      setBeersCache((prev) => new Map(prev).set(breweryName, data));
    } catch {
      // silently fail – user can retry by collapsing / expanding
    } finally {
      setLoadingBeers((prev) => {
        const next = new Set(prev);
        next.delete(breweryName);
        return next;
      });
    }
  }, [beersCache]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        fetchBeers(name);
      }
      return next;
    });
  };

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
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      ) : breweries.length === 0 ? (
        <Typography color="text.secondary">
          No breweries yet. Add beers to events to see them here!
        </Typography>
      ) : (
        <Stack spacing={1}>
          {breweries.map((brewery) => {
            const isExpanded = expanded.has(brewery.name);
            const beers = beersCache.get(brewery.name);
            const isLoadingBeers = loadingBeers.has(brewery.name);
            const avgAll = brewery.avgRating;

            return (
              <Box
                key={brewery.name}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {/* Collapsed header row */}
                <Box
                  onClick={() => toggleExpand(brewery.name)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "background-color 0.15s",
                  }}
                >
                  <BreweryImageUpload
                    breweryName={brewery.name}
                    imageUrl={brewery.imageUrl}
                    onImageChange={(newUrl) => {
                      setBreweries((prev) =>
                        prev.map((b) =>
                          b.name === brewery.name ? { ...b, imageUrl: newUrl } : b
                        )
                      );
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {brewery.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${brewery.beerCount} beer${brewery.beerCount !== 1 ? "s" : ""}`}
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                  />
                  {avgAll > 0 && (
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: getRatingColor(avgAll), flexShrink: 0 }}
                    >
                      {avgAll}
                    </Typography>
                  )}
                  <IconButton
                    size="small"
                    sx={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Expandable beer list – loaded on demand */}
                <Collapse in={isExpanded}>
                  {isLoadingBeers ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : beers ? (
                    <Stack spacing={1} sx={{ px: 2, pb: 2, pt: 0.5 }}>
                      {beers.map((beer) => (
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
                              <Rating value={beer.avgRating} readOnly size="small" precision={0.1}
                                sx={{ "& .MuiRating-iconFilled": { color: getRatingColor(beer.avgRating) } }} />
                              <Typography variant="body2" sx={{ color: getRatingColor(beer.avgRating) }}>
                                {beer.avgRating}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : null}
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

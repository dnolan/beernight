import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { SportsBar, Star } from "@mui/icons-material";
import { getRatingColor } from "@/lib/utils";

interface EventStatsProps {
  beerCount: number;
  avgAbv: number;
  avgRating: number;
  reviewCount: number;
}

export default function EventStats({
  beerCount,
  avgAbv,
  avgRating,
  reviewCount,
}: EventStatsProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      <Chip
        icon={<SportsBar sx={{ fontSize: 18 }} />}
        label={`${beerCount} beer${beerCount !== 1 ? "s" : ""}`}
        variant="outlined"
      />
      {beerCount > 0 && (
        <Chip
          label={`Avg ${avgAbv}% ABV`}
          variant="outlined"
          sx={{ fontFamily: "monospace" }}
        />
      )}
      {reviewCount > 0 && (
        <Chip
          icon={<Star sx={{ fontSize: 18 }} />}
          label={
            <>
              {avgRating} / 5{" "}
              <Typography component="span" variant="caption" sx={{ opacity: 0.55 }}>
                ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </Typography>
            </>
          }
          variant="outlined"
          sx={{
            borderColor: getRatingColor(avgRating),
            color: getRatingColor(avgRating),
            "& .MuiChip-icon": { color: getRatingColor(avgRating) },
          }}
        />
      )}
    </Box>
  );
}

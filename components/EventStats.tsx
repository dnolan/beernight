import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { SportsBar, Star } from "@mui/icons-material";

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
          icon={<Star sx={{ fontSize: 18, color: "#facc15" }} />}
          label={
            <>
              {avgRating} / 5{" "}
              <Typography component="span" variant="caption" color="text.secondary">
                ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </Typography>
            </>
          }
          variant="outlined"
        />
      )}
    </Box>
  );
}

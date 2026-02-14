import { Beer as BeerIcon, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <BeerIcon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {beerCount} beer{beerCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      {beerCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Badge variant="outline" className="font-mono">
            {avgAbv}%
          </Badge>
          <p className="text-sm text-muted-foreground">Avg ABV</p>
        </div>
      )}
      {reviewCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <div>
            <p className="text-sm font-medium">{avgRating} / 5</p>
            <p className="text-xs text-muted-foreground">
              {reviewCount} review{reviewCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

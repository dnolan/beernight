import Link from "next/link";
import { Calendar, Beer as BeerIcon, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: {
    _id: string;
    title?: string;
    date: string;
    beerCount: number;
    reviewCount: number;
    avgAbv: number;
    avgRating: number;
  };
}

function getEventDisplayTitle(event: { title?: string; date: string }) {
  if (event.title) return event.title;
  const d = new Date(event.date);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function EventCard({ event }: EventCardProps) {
  const title = getEventDisplayTitle(event);
  const dateFormatted = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/events/${event._id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {dateFormatted}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BeerIcon className="h-3 w-3" />
              {event.beerCount} beer{event.beerCount !== 1 ? "s" : ""}
            </Badge>
            {event.beerCount > 0 && (
              <Badge variant="secondary">
                Avg {event.avgAbv}% ABV
              </Badge>
            )}
            {event.reviewCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {event.avgRating}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

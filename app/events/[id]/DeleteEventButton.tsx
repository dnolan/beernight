"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this event? All beers and reviews will be permanently removed."
      )
    ) {
      return;
    }

    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    router.push("/events");
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      Delete
    </Button>
  );
}

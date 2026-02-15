"use client";

import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { Delete } from "@mui/icons-material";

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
      variant="outlined"
      size="small"
      color="error"
      startIcon={<Delete sx={{ fontSize: 16 }} />}
      onClick={handleDelete}
    >
      Delete
    </Button>
  );
}

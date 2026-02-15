"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { Delete } from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteEventButton({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    setOpen(false);
    router.push("/events");
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="error"
        startIcon={<Delete sx={{ fontSize: 16 }} />}
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete Event"
        message={`Delete "${eventName}"? All beers and reviews will be permanently removed.`}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

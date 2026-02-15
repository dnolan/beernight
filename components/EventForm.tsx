"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

interface EventFormProps {
  initialData?: {
    _id: string;
    title?: string;
    date: string;
  };
}

export default function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/events/${initialData._id}`
        : "/api/events";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined, date }),
      });

      if (res.ok) {
        const event = await res.json();
        router.push(`/events/${event._id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 512, mx: "auto" }}>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isEditing ? "Edit Event" : "New Event"}
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Title"
              placeholder="e.g. February Beer Night"
              helperText="Defaults to month name if left empty"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !date}
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Event"
                : "Create Event"}
          </Button>
        </CardActions>
      </form>
    </Card>
  );
}

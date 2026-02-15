"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Add, Delete, Email } from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";

interface WhitelistedEmail {
  _id: string;
  email: string;
  addedAt: string;
}

export default function WhitelistPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<WhitelistedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/whitelist")
      .then((res) => res.json())
      .then((data) => {
        setEmails(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setAdding(true);

    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (res.ok) {
        const entry = await res.json();
        setEmails((prev) => [entry, ...prev]);
        setNewEmail("");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmail) return;
    setDeleting(true);
    await fetch(`/api/whitelist?email=${encodeURIComponent(deleteEmail)}`, {
      method: "DELETE",
    });
    setEmails((prev) => prev.filter((e) => e.email !== deleteEmail));
    setDeleteEmail(null);
    setDeleting(false);
  };

  if (!session) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>
        Manage Whitelist
      </Typography>
      <Typography color="text.secondary">
        Only whitelisted email addresses can sign in to Beer Night.
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Add Email
          </Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: "flex", gap: 1 }}>
            <TextField
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              size="small"
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={adding || !newEmail}
              startIcon={<Add />}
            >
              {adding ? "Adding..." : "Add"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Whitelisted Emails ({emails.length})
          </Typography>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : emails.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No emails whitelisted yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {emails.map((entry) => (
                <Box
                  key={entry._id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="body2">{entry.email}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteEmail(entry.email)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteEmail}
        title="Remove Email"
        message={`Remove "${deleteEmail}" from the whitelist? They will no longer be able to sign in.`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteEmail(null)}
      />
    </Box>
  );
}

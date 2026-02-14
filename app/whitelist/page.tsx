"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const handleDelete = async (email: string) => {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;

    await fetch(`/api/whitelist?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
    setEmails((prev) => prev.filter((e) => e.email !== email));
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Whitelist</h1>
      <p className="text-muted-foreground">
        Only whitelisted email addresses can sign in to Beer Night.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={adding || !newEmail}>
              <Plus className="mr-1.5 h-4 w-4" />
              {adding ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Whitelisted Emails ({emails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No emails whitelisted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {emails.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{entry.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

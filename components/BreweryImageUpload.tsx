"use client";

import { useState, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import {
  AddAPhoto,
  Delete,
  FileUpload,
  Link as LinkIcon,
} from "@mui/icons-material";

interface BreweryImageUploadProps {
  breweryName: string;
  imageUrl: string;
  onImageChange: (newUrl: string) => void;
}

export default function BreweryImageUpload({
  breweryName,
  imageUrl,
  onImageChange,
}: BreweryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL tab state
  const [pasteUrl, setPasteUrl] = useState("");

  const openDialog = () => {
    setDialogOpen(true);
    setTab(0);
    setError("");
    setPasteUrl("");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setError("");
  };

  // ---- File upload ----
  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          `/api/breweries/${encodeURIComponent(breweryName)}/image`,
          { method: "PUT", body: formData }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const { imageUrl: newUrl } = await res.json();
        onImageChange(newUrl);
        closeDialog();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [breweryName, onImageChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- URL submit ----
  const handleUrlSubmit = async () => {
    if (!pasteUrl.trim()) return;
    setUploading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/breweries/${encodeURIComponent(breweryName)}/image`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: pasteUrl.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const { imageUrl: newUrl } = await res.json();
      onImageChange(newUrl);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch image");
    } finally {
      setUploading(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    setUploading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/breweries/${encodeURIComponent(breweryName)}/image`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      onImageChange("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handleFileChange}
        />

        {imageUrl ? (
          <Box
            sx={{
              position: "relative",
              width: 56,
              height: 56,
              borderRadius: 1.5,
              overflow: "hidden",
              flexShrink: 0,
              "&:hover .brewery-img-overlay": { opacity: 1 },
            }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt={breweryName}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {!uploading && (
              <Box
                className="brewery-img-overlay"
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.25,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                <Tooltip title="Change image">
                  <IconButton
                    size="small"
                    sx={{ color: "white" }}
                    onClick={openDialog}
                  >
                    <AddAPhoto sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove image">
                  <IconButton
                    size="small"
                    sx={{ color: "white" }}
                    onClick={handleDelete}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {uploading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={20} sx={{ color: "white" }} />
              </Box>
            )}
          </Box>
        ) : (
          <Tooltip title="Add brewery image">
            <Box
              onClick={() => !uploading && openDialog()}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1.5,
                border: 2,
                borderColor: "divider",
                borderStyle: "dashed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
                transition: "all 0.2s",
              }}
            >
              {uploading ? (
                <CircularProgress size={20} />
              ) : (
                <AddAPhoto sx={{ fontSize: 20, color: "text.secondary" }} />
              )}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* ---- Image Source Dialog ---- */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxHeight: "80vh" } }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          Set image for {breweryName}
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Tabs
            value={tab}
            onChange={(_e, v) => {
              setTab(v);
              setError("");
            }}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab
              icon={<FileUpload sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Upload"
              sx={{ minHeight: 48 }}
            />
            <Tab
              icon={<LinkIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Paste URL"
              sx={{ minHeight: 48 }}
            />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Upload Tab */}
          {tab === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                py: 3,
              }}
            >
              <Box
                onClick={() => !uploading && fileInputRef.current?.click()}
                sx={{
                  width: "100%",
                  minHeight: 140,
                  border: 2,
                  borderColor: "divider",
                  borderStyle: "dashed",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                  transition: "all 0.2s",
                }}
              >
                {uploading ? (
                  <CircularProgress size={32} />
                ) : (
                  <>
                    <FileUpload
                      sx={{ fontSize: 40, color: "text.secondary" }}
                    />
                    <Typography color="text.secondary">
                      Click to choose a file
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      JPEG, PNG, WebP or GIF — max 5 MB
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Paste URL Tab */}
          {tab === 1 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                py: 1,
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="https://example.com/brewery-logo.png"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlSubmit();
                }}
                disabled={uploading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {pasteUrl.trim() && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "action.hover",
                    maxHeight: 200,
                  }}
                >
                  <Box
                    component="img"
                    src={pasteUrl.trim()}
                    alt="Preview"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).style.display = "block";
                    }}
                  />
                </Box>
              )}
              <Button
                variant="contained"
                onClick={handleUrlSubmit}
                disabled={!pasteUrl.trim() || uploading}
                startIcon={
                  uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : undefined
                }
              >
                {uploading ? "Uploading…" : "Use this image"}
              </Button>
            </Box>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}

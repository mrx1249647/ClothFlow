"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

type NotificationItem = { id: string; title: string; description: string; type: string; created_at: string; details?: Record<string, unknown> };

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const payload = await res.json();
      setItems(payload.notifications || []);
    }

    load();
  }, [router]);

  return (
    <AppShell title="الإشعارات" subtitle="آخر التحديثات المهمة لمتجرك">
      <Stack spacing={3}>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Typography color="text.secondary">{item.description}</Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Chip label={item.type} color={item.type === "sale" ? "success" : "primary"} /><Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => setSelected(item)}>التفاصيل</Button></Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {new Date(item.created_at).toLocaleString("ar-EG")}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent><Stack spacing={1}>{selected?.details && Object.entries(selected.details).filter(([key]) => key !== "items" && key !== "imageUrl").map(([key, value]) => <Typography key={key}>{key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}</Typography>)}{typeof selected?.details?.imageUrl === "string" ? <Box component="img" src={selected.details.imageUrl} alt="تفاصيل العملية" sx={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }} /> : null}{Array.isArray(selected?.details?.items) ? selected.details.items.map((item, index) => { const line = item as { name?: string; imageUrl?: string | null; size?: string; quantity?: number; subtotal?: number }; return <Stack key={`${line.name}-${index}`} direction="row" spacing={1} sx={{ alignItems: "center" }}><Box component="img" src={line.imageUrl || undefined} alt="" sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1 }} /><Typography>{line.name} · {line.size} × {line.quantity} · {Number(line.subtotal || 0).toLocaleString()} ج.م</Typography></Stack>; }) : null}</Stack></DialogContent>
      </Dialog>
    </AppShell>
  );
}

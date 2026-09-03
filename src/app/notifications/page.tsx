"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type NotificationItem = { id: string; title: string; description: string; type: string; created_at: string };

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);

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
                <Chip label={item.type} color={item.type === "sale" ? "success" : "primary"} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {new Date(item.created_at).toLocaleString("ar-EG")}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </AppShell>
  );
}

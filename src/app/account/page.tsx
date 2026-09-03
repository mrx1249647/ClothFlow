"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography, useTheme } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { AppShell } from "@/app/components/app-shell";

export default function AccountPage() {
  const router = useRouter();
  const theme = useTheme();
  const [form, setForm] = useState({ name: "", currentPassword: "", newPassword: "" });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) {
        router.replace("/login");
        return;
      }
      const data = await response.json();
      setForm((current) => ({ ...current, name: data.user.name }));
      setEmail(data.user.email);
    });
  }, [router]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.message || "تعذر حفظ التغييرات");
      return;
    }
    setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
    setMessage(data.passwordChanged ? "تم تحديث البيانات وكلمة المرور بنجاح" : "تم تحديث بيانات الحساب");
  }

  return (
    <AppShell title="إعداد الحساب" subtitle="حدّث بياناتك واحتفظ بحسابك آمنًا">
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <Card sx={{ borderRadius: 5, overflow: "hidden", boxShadow: "0 28px 80px rgba(74,92,88,.12)" }}>
          <Box sx={{ p: { xs: 3, md: 5 }, color: "white", background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>
            <PersonRoundedIcon sx={{ fontSize: 42, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>بيانات الحساب</Typography>
            <Typography sx={{ opacity: .9 }}>حدّث بياناتك واحتفظ بحسابك آمنًا</Typography>
          </Box>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack component="form" onSubmit={save} spacing={2.5}>
              <TextField label="الاسم" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <TextField label="البريد الإلكتروني" value={email} disabled />
              <Divider />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>تغيير كلمة المرور</Typography>
              <TextField type="password" label="كلمة المرور الحالية" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} slotProps={{ input: { startAdornment: <LockRoundedIcon color="primary" sx={{ mr: 1 }} /> } }} />
              <TextField type="password" label="كلمة المرور الجديدة" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
              {error ? <Alert severity="error">{error}</Alert> : null}
              {message ? <Alert severity="success">{message}</Alert> : null}
              <Button type="submit" variant="contained" size="large" disabled={pending}>{pending ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
              <Button type="button" variant="text" onClick={() => router.push("/dashboard")}>العودة إلى لوحة التحكم</Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </AppShell>
  );
}
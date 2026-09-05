"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";

export default function VerifyAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setEmail(new URLSearchParams(window.location.search).get("email") || ""), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const response = await fetch("/api/auth/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "تعذر تأكيد الحساب"); return; }
    setMessage(data.message); setTimeout(() => router.push("/login"), 900);
  }

  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}><Card sx={{ width: "min(100%, 460px)" }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Stack component="form" onSubmit={submit} spacing={2.5}><Typography variant="h4" sx={{ fontWeight: 900 }}>تأكيد الحساب</Typography><Typography color="text.secondary">أدخل الرمز المرسل إلى بريدك الإلكتروني.</Typography><TextField required type="email" label="البريد الإلكتروني" value={email} onChange={(event) => setEmail(event.target.value)} /><TextField required label="رمز التحقق" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputProps={{ inputMode: "numeric", maxLength: 6 }} />{error ? <Alert severity="error">{error}</Alert> : null}{message ? <Alert severity="success">{message}</Alert> : null}<Button type="submit" variant="contained">تأكيد الحساب</Button><Link href="/login" underline="hover" sx={{ textAlign: "center" }}>العودة لتسجيل الدخول</Link></Stack></CardContent></Card></Box>;
}
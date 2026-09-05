"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setError(""); setMessage("");
    const response = await fetch("/api/auth/password-reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json();
    setPending(false);
    if (!response.ok) { setError(data.message || "تعذر إرسال الرمز"); return; }
    setMessage(data.message);
    setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 700);
  }

  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}><Card sx={{ width: "min(100%, 460px)" }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Stack component="form" onSubmit={submit} spacing={2.5}><Typography variant="h4" sx={{ fontWeight: 900 }}>نسيت كلمة المرور؟</Typography><Typography color="text.secondary">أدخل بريدك وسنرسل رمز تحقق مؤقت صالحًا لمدة 10 دقائق.</Typography><TextField required type="email" label="البريد الإلكتروني" value={email} onChange={(event) => setEmail(event.target.value)} />{error ? <Alert severity="error">{error}</Alert> : null}{message ? <Alert severity="success">{message}</Alert> : null}<Button type="submit" variant="contained" disabled={pending}>{pending ? "جاري الإرسال..." : "إرسال رمز التحقق"}</Button><Link href="/login" underline="hover" sx={{ textAlign: "center" }}>العودة لتسجيل الدخول</Link></Stack></CardContent></Card></Box>;
}
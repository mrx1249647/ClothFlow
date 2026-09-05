"use client";

import { Box, Button, Card, CardContent, Link, Stack, Typography } from "@mui/material";

export default function ForgotPasswordPage() {
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}><Card sx={{ width: "min(100%, 460px)" }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Stack spacing={2.5}><Typography variant="h4" sx={{ fontWeight: 900 }}>نسيت كلمة المرور؟</Typography><Typography color="text.secondary">التفعيل اليدوي مفعل مؤقتًا. تواصل مع مشرف الموقع لتغيير كلمة المرور.</Typography><Button component="a" href="https://wa.me/201013419143" target="_blank" rel="noreferrer" variant="contained">التواصل عبر واتساب</Button><Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>واتساب: 01013419143</Typography><Link href="/login" underline="hover" sx={{ textAlign: "center" }}>العودة لتسجيل الدخول</Link></Stack></CardContent></Card></Box>;
}
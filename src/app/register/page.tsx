"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

export default function RegisterPage() {
  const router = useRouter();
  const theme = useTheme();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // ignore
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(data.message || "تعذر إنشاء الحساب");
      return;
    }

    setSuccess("تم إنشاء الحساب بنجاح، سيتم توجيهك إلى تسجيل الدخول");
    setTimeout(() => router.push("/login"), 1200);
  }

  if (checkingSession) {
    return (
      <Container maxWidth="lg" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 4 }}>
        <Box className="page-loading-shell" sx={{ width: "100%" }}>
          <Box className="glass-loader" sx={{ maxWidth: 420 }}>
            <Box className="glass-loader__brand">
              <Box className="glass-loader__logo" />
            </Box>
            <Box className="glass-loader__line glass-loader__title" />
            <Box className="glass-loader__line glass-loader__subtitle" />
            <Box className="glass-loader__field glass-loader__line" />
            <Box className="glass-loader__field glass-loader__line" />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 4, background: `radial-gradient(circle at top, ${theme.palette.secondary.light}55, ${theme.palette.background.default} 52%)` }}>
      <Container maxWidth="lg">
        <Card sx={{ borderRadius: 5, overflow: "hidden", boxShadow: "0 28px 80px rgba(74, 92, 88, 0.12)" }}>
          <Grid container>
            <Grid size={{ xs: 12, md: 6 }} sx={{ p: 0 }}>
              <Box sx={{ height: "100%", p: { xs: 3, md: 5 }, background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`, color: "white", position: "relative" }}>
                <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 40%)" }} />
                <Stack spacing={3} sx={{ position: "relative", height: "100%", justifyContent: "center" }}>
                  <Box sx={{ width: 72, height: 72, borderRadius: 4, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <PersonAddAltRoundedIcon sx={{ fontSize: 36 }} />
                  </Box>

                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.04, mb: 1 }}>ClothFlow</Typography>
                    <Typography sx={{ fontSize: 18, opacity: 0.9 }}>أنشئ حسابك الآن وابدأ إدارة متجرك بسهولة.</Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    {[
                      "إدارة مخزونك ومنتجاتك من مكان واحد",
                      "متابعة المبيعات والإشعارات بشكل مباشر",
                      "حسابات آمنة مع سياسات الوصول",
                    ].map((item) => (
                      <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: 0.96 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.95)" }} />
                        <Typography>{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Stack spacing={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>إنشاء حساب</Typography>
                    <Typography color="text.secondary">ابدأ الآن بإدارة مبيعاتك من لوحة الإدارة</Typography>
                  </Box>

                  <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
                    <Stack spacing={2.5}>
                      <TextField
                        fullWidth
                        label="اسم المستخدم"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />

                      <TextField
                        fullWidth
                        label="البريد الإلكتروني"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <EmailRoundedIcon color="primary" />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        label="كلمة المرور"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <Button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  sx={{ minWidth: 0, p: 0, color: "text.secondary" }}
                                >
                                  {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                </Button>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      <FormControlLabel control={<Checkbox defaultChecked />} label="أوافق على الشروط" />

                      {error ? <Alert severity="error">{error}</Alert> : null}
                      {success ? <Alert severity="success">{success}</Alert> : null}

                      <Button type="submit" fullWidth variant="contained" size="large" disabled={pending} sx={{ py: 1.5, borderRadius: 3 }}>
                        {pending ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                      </Button>
                      <Button component="a" href="/api/auth/google" fullWidth variant="outlined" size="large" sx={{ py: 1.5, borderRadius: 3 }}>
                        التسجيل باستخدام Google
                      </Button>
                    </Stack>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                    لديك حساب بالفعل؟{" "}
                    <Link href="/login" underline="hover" sx={{ fontWeight: 700 }}>
                      تسجيل الدخول
                    </Link>
                  </Typography>
                </Stack>
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, CardContent, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type DashboardData = { user?: { name?: string; role?: string }; stats: { users: number; stock: number; sales: number; revenue: number }; sales?: Sale[]; notifications?: NotificationItem[] };
type Sale = { id: string; product_name: string; customer: string; quantity: number; total: number };
type NotificationItem = { id: string; title: string; description: string };

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        setData(await response.json());
      })
      .catch(() => setError("تعذر تحميل بيانات لوحة التحكم"));
  }, [router]);

  if (!data) {
    return <div className="page-loading-shell" aria-live="polite" aria-busy="true"><div className="glass-loader"><div className="glass-loader__brand"><div className="glass-loader__logo" /></div><div className="glass-loader__line glass-loader__title" /><div className="glass-loader__line glass-loader__subtitle" /><div className="glass-loader__card" /></div></div>;
  }

  const stats = [
    { label: "الحسابات", value: data.stats.users },
    { label: "المخزون", value: data.stats.stock },
    { label: "المبيعات", value: data.stats.sales },
    { label: "الإيراد", value: `${Number(data.stats.revenue).toLocaleString()} ر.س` },
  ];

  return (
    <AppShell title="لوحة التحكم" subtitle={`مرحباً ${data.user?.name}، إليك ملخص متجرك اليوم`} user={data.user}>
      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
      {data.user?.role === "admin" ? <Button variant="contained" href="/admin" sx={{ mb: 3 }}>إدارة الحسابات وتفعيلها</Button> : null}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((stat) => <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}><Card sx={{ height: "100%" }}><CardContent><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{stat.label}</Typography><Typography variant="h4" sx={{ fontWeight: 900 }}>{stat.value}</Typography></CardContent></Card></Grid>)}
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}><Card><CardContent><Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>آخر المبيعات</Typography><Table size="small"><TableHead><TableRow><TableCell>المنتج</TableCell><TableCell>العميل</TableCell><TableCell>الكمية</TableCell><TableCell>الإجمالي</TableCell></TableRow></TableHead><TableBody>{data.sales?.slice(0, 5).map((sale) => <TableRow key={sale.id}><TableCell>{sale.product_name}</TableCell><TableCell>{sale.customer}</TableCell><TableCell>{sale.quantity}</TableCell><TableCell>{Number(sale.total).toLocaleString()} ر.س</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card><CardContent><Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>الإشعارات</Typography><Stack spacing={1.5}>{data.notifications?.map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ fontWeight: 700 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Paper>)}</Stack></CardContent></Card></Grid>
      </Grid>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type Product = { id: string; name: string; stock: number };

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ productId: "", quantity: "1", customer: "", soldBy: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch("/api/products");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const payload = await res.json();
      setProducts(payload.products || []);
    }

    loadProducts();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "تعذر إتمام البيع");
      return;
    }
    setStatus("تمت عملية البيع بنجاح");
    setForm({ productId: "", quantity: "1", customer: "", soldBy: "" });
  }

  return (
    <AppShell title="صفحة البيع" subtitle="سجّل المبيعات وحدّث المخزون مباشرة">
      <Stack spacing={3}>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>إتمام عملية بيع</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="المنتج"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} - {product.stock} متوفر
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="الكمية" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="اسم العميل" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="بائع/موظف" value={form.soldBy} onChange={(e) => setForm({ ...form, soldBy: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">تأكيد البيع</Button>
                </Grid>
              </Grid>
            </Box>
            {status ? <Alert sx={{ mt: 2 }} severity={status.includes("نجاح") ? "success" : "info"}>{status}</Alert> : null}
          </CardContent>
        </Card>
      </Stack>
    </AppShell>
  );
}

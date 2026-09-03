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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type Product = { id: string; name: string; category: string; sku: string; stock: number; price: number };

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: "", category: "", sku: "", stock: "", price: "" });
  const [status, setStatus] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/products");
    if (!res.ok) {
      router.push("/login");
      return;
    }
    const payload = await res.json();
    setProducts(payload.products || []);
  }

  useEffect(() => {
    // The request updates UI state after the network response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
    // loadProducts is intentionally scoped to this page's request lifecycle.
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "تعذر حفظ المنتج");
      return;
    }
    setForm({ name: "", category: "", sku: "", stock: "", price: "" });
    setStatus("تم حفظ المنتج بنجاح");
    loadProducts();
  }

  return (
    <AppShell title="المخزون" subtitle="إدارة المنتجات والكميات المتاحة">
      <Stack spacing={3}>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>إضافة منتج جديد</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="الفئة" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="الكمية" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="السعر" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">حفظ المنتج</Button>
                </Grid>
              </Grid>
            </Box>
            {status ? <Alert sx={{ mt: 2 }} severity={status.includes("نجاح") ? "success" : "info"}>{status}</Alert> : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>قائمة المنتجات</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>اسم المنتج</TableCell>
                  <TableCell>الفئة</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>الكمية</TableCell>
                  <TableCell>السعر</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{Number(product.price).toLocaleString()} ر.س</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
    </AppShell>
  );
}

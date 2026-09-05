"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { AppShell } from "@/app/components/app-shell";

type Product = { id: string; name: string; category: string; image_url?: string | null; stock: number; price: number; sizes?: { label: string; stock: number }[] };

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: "", category: "", stock: "", price: "", imageUrl: "", sizesText: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    const sizes = form.sizesText.split(",").map((entry) => {
      const [label, stock] = entry.split(":").map((value) => value.trim());
      return { label, stock: Number(stock) };
    }).filter((size) => size.label && Number.isInteger(size.stock) && size.stock >= 0);
    const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sizes, stock: sizes.length ? sizes.reduce((sum, size) => sum + size.stock, 0) : Number(form.stock) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "تعذر حفظ المنتج");
      return;
    }
    setForm({ name: "", category: "", stock: "", price: "", imageUrl: "", sizesText: "" });
    setEditingId(null);
    setStatus(editingId ? "تم تحديث المنتج بنجاح" : "تم حفظ المنتج بنجاح");
    loadProducts();
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, stock: String(product.stock), price: String(product.price), imageUrl: product.image_url || "", sizesText: (product.sizes || []).map((size) => `${size.label}:${size.stock}`).join(", ") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct() {
    if (!deleteId) return;
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    const data = await res.json();
    setDeleteId(null);
    setStatus(res.ok ? "تم حذف المنتج" : data.message || "تعذر حذف المنتج");
    if (res.ok) loadProducts();
  }

  return (
    <AppShell title="المخزون" subtitle="إدارة المنتجات والكميات المتاحة">
      <Stack spacing={3}>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>{editingId ? "تعديل المنتج" : "إضافة منتج جديد"}</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="الفئة" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="إجمالي الكمية" type="number" value={form.stock} slotProps={{ htmlInput: { readOnly: Boolean(form.sizesText) } }} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="السعر" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="المقاسات والكميات" placeholder="S:10, L:8, XL:4 أو 36:2, 40:5" value={form.sizesText} onChange={(e) => setForm({ ...form, sizesText: e.target.value })} helperText="افصل بين المقاسات بفاصلة، وبين المقاس والكمية بنقطتين" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button component="label" variant="outlined" fullWidth sx={{ height: 56 }}>
                    {form.imageUrl ? "تم اختيار صورة المنتج" : "اختيار صورة المنتج"}
                    <input hidden accept="image/*" type="file" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setForm((current) => ({ ...current, imageUrl: String(reader.result) }));
                      reader.readAsDataURL(file);
                    }} />
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1}>
                    <Button type="submit" variant="contained">{editingId ? "حفظ التعديلات" : "حفظ المنتج"}</Button>
                    {editingId ? <Button type="button" onClick={() => { setEditingId(null); setForm({ name: "", category: "", stock: "", price: "", imageUrl: "", sizesText: "" }); }}>إلغاء</Button> : null}
                  </Stack>
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
                  <TableCell>الكمية</TableCell>
                  <TableCell>السعر</TableCell>
                  <TableCell>الصورة</TableCell>
                    <TableCell>المقاسات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{Number(product.price).toLocaleString()} ج.م</TableCell>
                    <TableCell><Avatar src={product.image_url || undefined} variant="rounded" sx={{ width: 44, height: 44 }} /></TableCell>
                    <TableCell><Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>{product.sizes?.map((size) => <Chip key={size.label} size="small" label={`${size.label}: ${size.stock}`} />)}</Stack></TableCell>
                    <TableCell><Stack direction="row" spacing={0.5}><Button size="small" startIcon={<EditRoundedIcon />} onClick={() => startEditing(product)}>تعديل</Button><Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteId(product.id)}>حذف</Button></Stack></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>حذف المنتج؟</DialogTitle>
        <DialogContent>سيتم حذف المنتج وسجلات بيعه المرتبطة به نهائيًا.</DialogContent>
        <DialogActions><Button onClick={() => setDeleteId(null)}>إلغاء</Button><Button color="error" variant="contained" onClick={deleteProduct}>حذف</Button></DialogActions>
      </Dialog>
    </AppShell>
  );
}

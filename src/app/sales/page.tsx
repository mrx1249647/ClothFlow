"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Avatar, Box, Button, Card, CardContent, Divider, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { AppShell } from "@/app/components/app-shell";

type Size = { label: string; stock: number };
type Product = { id: string; name: string; category: string; stock: number; price: number; image_url?: string | null; sizes?: Size[] };
type CartLine = { product: Product; size: string; quantity: number };
type Invoice = { id: string; total: number; subtotal: number; discount: number; lines: CartLine[] };

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [shopName, setShopName] = useState("");
  const [customer, setCustomer] = useState("");
  const [soldBy, setSoldBy] = useState("");
  const [discount, setDiscount] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [status, setStatus] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch("/api/products").then(async (response) => {
      if (!response.ok) { router.push("/login"); return; }
      setProducts((await response.json()).products || []);
    }).catch(() => setStatus("تعذر تحميل المنتجات"));
  }, [router]);

  const filteredProducts = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()) && product.stock > 0);
  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0), [cart]);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const totalQuantity = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = subtotal - discountValue;

  function addProduct(product: Product, size: string) {
    const available = product.sizes?.find((item) => item.label === size)?.stock ?? product.stock;
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id && line.size === size);
      if (existing) return current.map((line) => line.product.id === product.id && line.size === size ? { ...line, quantity: Math.min(line.quantity + 1, available) } : line);
      return [...current, { product, size, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, size: string, amount: number) {
    setCart((current) => current.map((line) => {
      if (line.product.id !== id || line.size !== size) return line;
      const available = line.product.sizes?.find((item) => item.label === size)?.stock ?? line.product.stock;
      return { ...line, quantity: Math.max(1, Math.min(line.quantity + amount, available)) };
    }));
  }

  async function submitSale(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    const savedLines = cart;
    const response = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: savedLines.map((line) => ({ productId: line.product.id, size: line.size, quantity: line.quantity })), customer, soldBy, discount: discountValue, discountReason, shopName }) });
    const data = await response.json();
    if (!response.ok) { setStatus(data.message || "تعذر إتمام البيع"); return; }
    setStatus("تم تسجيل الفاتورة بنجاح");
    setInvoice({ id: data.sales?.[0]?.order_id || "", total, subtotal, discount: discountValue, lines: savedLines });
    setCart([]); setCustomer(""); setDiscount("0"); setDiscountReason("");
    const refreshed = await fetch("/api/products");
    if (refreshed.ok) setProducts((await refreshed.json()).products || []);
  }

  return (
    <AppShell title="نقطة البيع" subtitle="ابحث عن المنتجات وأضفها إلى الفاتورة">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card><CardContent><Stack spacing={2}>
            <TextField fullWidth placeholder="ابحث باسم المنتج أو الفئة" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <SearchRoundedIcon color="action" sx={{ mr: 1 }} /> } }} />
            <Grid container spacing={1.5}>
              {filteredProducts.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6 }}><Card variant="outlined"><CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Avatar src={product.image_url || undefined} variant="rounded">{product.name[0]}</Avatar><Box><Typography sx={{ fontWeight: 700 }}>{product.name}</Typography><Typography variant="body2" color="text.secondary">{product.category} · {Number(product.price).toLocaleString()} ج.م</Typography></Box></Stack><Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap" }}>{(product.sizes?.length ? product.sizes : [{ label: "موحد", stock: product.stock }]).filter((size) => size.stock > 0).map((size) => <Button key={size.label} size="small" variant="outlined" onClick={() => addProduct(product, size.label)}>{size.label} ({size.stock})</Button>)}</Stack></CardContent></Card></Grid>)}
            </Grid>
            {!filteredProducts.length ? <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>لا توجد منتجات متاحة</Typography> : null}
          </Stack></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card><CardContent><Box component="form" onSubmit={submitSale}><Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>الفاتورة الحالية</Typography>
            {cart.map((line) => <Box key={`${line.product.id}-${line.size}`}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Avatar src={line.product.image_url || undefined} variant="rounded" /><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 700 }}>{line.product.name} · {line.size}</Typography><Typography variant="body2">{(Number(line.product.price) * line.quantity).toLocaleString()} ج.م</Typography></Box><IconButton onClick={() => changeQuantity(line.product.id, line.size, -1)} aria-label="تقليل الكمية"><RemoveRoundedIcon /></IconButton><Typography>{line.quantity}</Typography><IconButton onClick={() => changeQuantity(line.product.id, line.size, 1)} aria-label="زيادة الكمية"><AddRoundedIcon /></IconButton><IconButton onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id || item.size !== line.size))} aria-label="حذف المنتج"><DeleteOutlineRoundedIcon /></IconButton></Stack><Divider sx={{ mt: 1 }} /></Box>)}
            {!cart.length ? <Typography color="text.secondary">أضف منتجات إلى الفاتورة</Typography> : null}
            <TextField required label="اسم المحل" value={shopName} onChange={(event) => setShopName(event.target.value)} /><TextField required label="اسم العميل" value={customer} onChange={(event) => setCustomer(event.target.value)} /><TextField required label="البائع / الموظف" value={soldBy} onChange={(event) => setSoldBy(event.target.value)} /><TextField label="الخصم بالجنيه" type="number" slotProps={{ htmlInput: { min: 0 } }} value={discount} onChange={(event) => setDiscount(event.target.value)} /><TextField label="سبب الخصم" value={discountReason} onChange={(event) => setDiscountReason(event.target.value)} />
            <Divider /><Stack spacing={0.75}><Typography>إجمالي عدد المنتجات: <strong>{totalQuantity}</strong></Typography><Typography>إجمالي المنتجات: <strong>{subtotal.toLocaleString()} ج.م</strong></Typography><Typography>الخصم: <strong>{discountValue.toLocaleString()} ج.م</strong></Typography><Typography variant="h6">المبلغ المطلوب: <strong>{total.toLocaleString()} ج.م</strong></Typography></Stack>
            {status ? <Alert severity={status.includes("نجاح") ? "success" : "error"}>{status}</Alert> : null}<Button type="submit" variant="contained" size="large" disabled={!cart.length}>تأكيد البيع</Button>
          </Stack></Box></CardContent></Card>
          {invoice ? <Card className="invoice-print" sx={{ mt: 2 }}><CardContent><Typography variant="h6" sx={{ fontWeight: 800 }}>{shopName}</Typography><Typography>فاتورة رقم: {invoice.id}</Typography><Divider sx={{ my: 1 }} />{invoice.lines.map((line) => <Stack key={`${line.product.id}-${line.size}`} direction="row" sx={{ justifyContent: "space-between" }}><Typography>{line.product.name} · {line.size} × {line.quantity}</Typography><Typography>{(Number(line.product.price) * line.quantity).toLocaleString()} ج.م</Typography></Stack>)}<Divider sx={{ my: 1 }} /><Typography>الإجمالي: {invoice.subtotal.toLocaleString()} ج.م</Typography><Typography>الخصم: {invoice.discount.toLocaleString()} ج.م</Typography><Typography variant="h6">المبلغ المطلوب: {invoice.total.toLocaleString()} ج.م</Typography><Button onClick={() => window.print()} sx={{ mt: 1 }}>طباعة / حفظ PDF</Button></CardContent></Card> : null}
        </Grid>
      </Grid>
    </AppShell>
  );
}

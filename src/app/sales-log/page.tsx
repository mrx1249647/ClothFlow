"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

type Sale = { id: string; product_name: string; image_url?: string | null; customer: string; quantity: number; sold_by: string; total: number; discount: number; discount_reason?: string | null; size?: string | null; shop_name?: string; created_at: string };

export default function SalesLogPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    async function loadSales() {
      const res = await fetch("/api/sales");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const payload = await res.json();
      setSales(payload.sales || []);
    }

    loadSales();
  }, [router]);

  return (
    <AppShell title="سجل المبيعات" subtitle="راجع العمليات المسجلة بالتفصيل">
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المنتج</TableCell>
                  <TableCell>العميل</TableCell>
                  <TableCell>الكمية</TableCell>
                  <TableCell>الموظف</TableCell>
                  <TableCell>الإجمالي</TableCell>
                  <TableCell>التاريخ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Avatar src={sale.image_url || undefined} variant="rounded" sx={{ width: 36, height: 36 }} />{sale.product_name}</Stack></TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.sold_by}</TableCell>
                    <TableCell>{Number(sale.total).toLocaleString()} ج.م</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleString("ar-EG")}</TableCell>
                    <TableCell><Button size="small" startIcon={<VisibilityRoundedIcon />} onClick={() => setSelected(sale)}>التفاصيل</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>تفاصيل عملية البيع</DialogTitle>
        <DialogContent>
          {selected ? <Box className="invoice-print" sx={{ p: { xs: 1, sm: 2 }, color: "text.primary" }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box><Typography variant="overline" color="primary.main">فاتورة بيع</Typography><Typography variant="h5" sx={{ fontWeight: 900 }}>{selected.shop_name || "ClothFlow"}</Typography><Typography variant="body2" color="text.secondary">إدارة المبيعات والمخزون</Typography></Box>
                <Avatar src={selected.image_url || undefined} variant="rounded" sx={{ width: 72, height: 72 }} />
              </Stack>
              <Divider />
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", flexWrap: "wrap" }}><Typography variant="body2">رقم العملية: <strong>{selected.id.slice(0, 8).toUpperCase()}</strong></Typography><Typography variant="body2">التاريخ: <strong>{new Date(selected.created_at).toLocaleString("ar-EG")}</strong></Typography></Stack>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}><Stack spacing={0.75}><Typography>العميل: <strong>{selected.customer}</strong></Typography><Typography>البائع: <strong>{selected.sold_by}</strong></Typography></Stack></Box>
              <Box className="invoice-table" sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}><Stack direction="row" sx={{ p: 1.5, bgcolor: "primary.main", color: "primary.contrastText", justifyContent: "space-between" }}><Typography>المنتج</Typography><Typography>الإجمالي</Typography></Stack><Stack direction="row" spacing={1.5} sx={{ p: 1.5, alignItems: "center", justifyContent: "space-between" }}><Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}><Avatar src={selected.image_url || undefined} variant="rounded" sx={{ width: 48, height: 48 }} /><Box><Typography sx={{ fontWeight: 800 }}>{selected.product_name}</Typography><Typography variant="body2" color="text.secondary">المقاس: {selected.size || "غير محدد"} · الكمية: {selected.quantity}</Typography></Box></Stack><Typography sx={{ fontWeight: 800 }}>{Number(selected.total).toLocaleString()} ج.م</Typography></Stack></Box>
              <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}><Typography>الخصم: {Number(selected.discount || 0).toLocaleString()} ج.م</Typography><Typography variant="body2" color="text.secondary">سبب الخصم: {selected.discount_reason || "بدون سبب"}</Typography><Divider sx={{ width: "100%", my: 0.5 }} /><Typography variant="h6" sx={{ fontWeight: 900 }}>الإجمالي المستحق: {Number(selected.total).toLocaleString()} ج.م</Typography></Stack>
              <Button className="invoice-print-action" variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>طباعة / حفظ PDF</Button>
            </Stack>
          </Box> : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

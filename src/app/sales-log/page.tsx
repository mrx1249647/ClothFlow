"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
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
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>تفاصيل عملية البيع</DialogTitle><DialogContent><Stack spacing={1.5}>{selected ? <><Avatar src={selected.image_url || undefined} variant="rounded" sx={{ width: 96, height: 96 }} /><Typography>المنتج: {selected.product_name}</Typography><Typography>المقاس: {selected.size || "غير محدد"}</Typography><Typography>المحل: {selected.shop_name || "غير محدد"}</Typography><Typography>العميل: {selected.customer}</Typography><Typography>البائع: {selected.sold_by}</Typography><Typography>الكمية: {selected.quantity}</Typography><Typography>الخصم: {Number(selected.discount || 0).toLocaleString()} ج.م</Typography><Typography>سبب الخصم: {selected.discount_reason || "بدون سبب"}</Typography><Typography>الإجمالي بعد الخصم: {Number(selected.total).toLocaleString()} ج.م</Typography><Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>طباعة / حفظ PDF</Button></> : null}</Stack></DialogContent></Dialog>
    </AppShell>
  );
}

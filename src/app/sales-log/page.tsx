"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type Sale = { id: string; product_name: string; customer: string; quantity: number; sold_by: string; total: number; created_at: string };

export default function SalesLogPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);

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
                    <TableCell>{sale.product_name}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.sold_by}</TableCell>
                    <TableCell>{Number(sale.total).toLocaleString()} ر.س</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleString("ar-EG")}</TableCell>
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

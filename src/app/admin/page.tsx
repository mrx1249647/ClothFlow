"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { AppShell } from "@/app/components/app-shell";

type AdminUser = { id: string; name: string; email: string; role: string; status: "active" | "pending" | "blocked"; trial_ends_at?: string | null };

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin");
    if (!res.ok) {
      setError("غير مصرح بالدخول إلى لوحة التحكم الخاصة بالإدارة");
      router.push("/dashboard");
      return;
    }
    const payload = await res.json();
    setUsers(payload.users || []);
  }

  useEffect(() => {
    // The request updates UI state after the network response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
    // loadUsers is intentionally scoped to this page's request lifecycle.
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(userId: string, status: string) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });

    if (!res.ok) {
      setError("تعذر تحديث حالة الحساب");
      return;
    }

    loadUsers();
  }

  async function openTrial(userId: string) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "trial" }) });
    if (!res.ok) setError("تعذر فتح الفترة التجريبية");
    loadUsers();
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("هل تريد حذف الحساب وبياناته نهائيًا؟")) return;
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "delete" }) });
    if (!res.ok) setError("تعذر حذف الحساب");
    loadUsers();
  }

  return (
    <AppShell title="إدارة الحسابات" subtitle="راجع الحسابات وفعّل الوصول حسب الحاجة">
      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>البريد</TableCell>
                  <TableCell>الدور</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>نهاية التجربة</TableCell>
                  <TableCell>إجراءات</TableCell>
                  <TableCell>تحديث</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>{user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString("ar-EG") : "غير محددة"}</TableCell>
                    <TableCell><Stack direction="row" spacing={1}><Button size="small" onClick={() => openTrial(user.id)}>تجربة 30 يومًا</Button>{user.role !== "admin" ? <Button size="small" color="error" onClick={() => deleteUser(user.id)}>حذف</Button> : null}</Stack></TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>الحالة</InputLabel>
                        <Select
                          value={user.status}
                          label="الحالة"
                          onChange={(e) => updateStatus(user.id, String(e.target.value))}
                        >
                          <MenuItem value="active">مفعل</MenuItem>
                          <MenuItem value="pending">قيد الانتظار</MenuItem>
                          <MenuItem value="blocked">ممنوع</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
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

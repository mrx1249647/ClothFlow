"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { themeOptions } from "@/theme";
import { useThemeMode } from "@/components/providers";

const sections = [
  { label: "لوحة التحكم", href: "/dashboard", icon: <DashboardRoundedIcon /> },
  { label: "المخزون", href: "/inventory", icon: <Inventory2RoundedIcon /> },
  { label: "بيع", href: "/sales", icon: <ShoppingCartRoundedIcon /> },
  { label: "سجل البيع", href: "/sales-log", icon: <HistoryRoundedIcon /> },
  { label: "الإشعارات", href: "/notifications", icon: <NotificationsRoundedIcon /> },
];

export function AppShell({ title, subtitle, user, children }: { title: string; subtitle?: string; user?: { name?: string; role?: string }; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { themeName, setThemeName } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const sidebar = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", background: `linear-gradient(135deg, ${theme.palette.primary.main}18, ${theme.palette.secondary.main}20)` }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>ClothFlow</Typography>
        <Typography variant="body2" color="text.secondary">إدارة المتجر بوضوح</Typography>
      </Box>
      <List sx={{ px: 1.5, py: 2 }}>
        {sections.map((item) => (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton selected={pathname === item.href} onClick={() => { setMenuOpen(false); router.push(item.href); }}>
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: "auto", p: 2 }}>
        <ListItemButton onClick={() => router.push("/account")} sx={{ mb: 1 }}>
          <ListItemIcon sx={{ minWidth: 38 }}><PersonRoundedIcon /></ListItemIcon>
          <ListItemText primary="إعداد الحساب" />
        </ListItemButton>
        <ListItemButton onClick={logout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}><LogoutRoundedIcon /></ListItemIcon>
          <ListItemText primary="تسجيل الخروج" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", background: `linear-gradient(145deg, ${theme.palette.background.default}, ${theme.palette.primary.light}18 55%, ${theme.palette.secondary.light}30)` }}>
      {isMobile ? <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: 280 } }}>{sidebar}</Drawer> : <Drawer variant="permanent" anchor="right" sx={{ "& .MuiDrawer-paper": { width: 264, boxSizing: "border-box" } }}>{sidebar}</Drawer>}
      <Box sx={{ mr: { md: "264px" } }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: "background.default", borderBottom: 1, borderColor: "divider", backdropFilter: "blur(14px)" }}>
          <Toolbar sx={{ justifyContent: "space-between", gap: 2, flexWrap: "wrap", py: 1 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              {isMobile ? <IconButton onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><MenuRoundedIcon /></IconButton> : null}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{title}</Typography>
                {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Select size="small" value={themeName} onChange={(event) => setThemeName(event.target.value as keyof typeof themeOptions)} aria-label="اختيار الثيم" sx={{ minWidth: 132 }}>
                {Object.entries(themeOptions).map(([key, option]) => <MenuItem key={key} value={key}>{option.label}</MenuItem>)}
              </Select>
              <Avatar sx={{ bgcolor: "primary.main" }}><PersonRoundedIcon /></Avatar>
              <Chip label={user?.role === "admin" ? "مدير النظام" : user?.name || "المتجر"} color="primary" variant="outlined" />
            </Stack>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}

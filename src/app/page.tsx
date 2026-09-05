import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 3, background: "linear-gradient(145deg, #f7fbf8, #e5f1ed)" }}>
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ textAlign: "center", alignItems: "center" }}>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: "3rem", md: "5rem" }, color: "primary.main" }}>ClothFlow</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>إدارة مخزون ومبيعات متجر الملابس في مكان واحد</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 620 }}>منصة SaaS تساعدك على متابعة المنتجات والمبيعات والفواتير والإشعارات لكل متجر وحساب بشكل مستقل.</Typography>
          <Button href="/login" variant="contained" size="large">تسجيل الدخول إلى المنصة</Button>
        </Stack>
      </Container>
    </Box>
  );
}

import { Box, CircularProgress, LinearProgress, Typography } from "@mui/material";

export default function Loading() {
  return (
    <Box aria-live="polite" aria-busy="true" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3, background: "linear-gradient(145deg, #f2f8fa, #d9edf0)" }}>
      <Box sx={{ width: "min(420px, 100%)", p: { xs: 3, sm: 5 }, textAlign: "center", borderRadius: 4, bgcolor: "background.paper", boxShadow: "0 24px 70px rgba(31,45,43,.12)" }}>
        <CircularProgress color="primary" size={52} thickness={4} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>جاري تجهيز ClothFlow</Typography>
        <LinearProgress color="secondary" sx={{ borderRadius: 99 }} />
      </Box>
    </Box>
  );
}

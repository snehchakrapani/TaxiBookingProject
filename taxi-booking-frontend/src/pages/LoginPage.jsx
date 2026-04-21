import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { AirportShuttleRounded, ArrowForwardRounded, EmailRounded, LockRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/authApi";
import { selectIsLoggedIn, selectRole, setCredentials } from "../features/auth/authSlice";
import { getApiError } from "../constants/ride";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3, color: "#f6f7f8",
    backgroundColor: "rgba(13,17,23,0.5)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "#ffd54f" },
    "&.Mui-focused fieldset": { borderColor: "#ffb300", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.68)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffd54f" },
};

const btnSx = {
  py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: "none",
  background: "linear-gradient(135deg,#ffca28,#ffb300,#fb8c00)", color: "#111318",
  boxShadow: "0 16px 28px rgba(251,140,0,0.28)",
  "&:hover": { background: "linear-gradient(135deg,#ffd54f,#ffb300,#f57c00)" },
  "&:disabled": { color: "rgba(17,19,24,0.72)", background: "linear-gradient(135deg,#ffe082,#ffca28)" },
};

const FEATURES = [
  "Book rides in seconds with a clean, familiar flow",
  "Track your trip and driver updates in one place",
  "Built for riders and drivers moving across the city",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const role = useSelector(selectRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (isLoggedIn) navigate(role === "Driver" ? "/driver" : "/book", { replace: true });
  }, [isLoggedIn, navigate, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      dispatch(setCredentials(result));
      navigate(result.role === "Driver" ? "/driver" : "/book", { replace: true });
    } catch (err) {
      setError(getApiError(err, "Login failed. Please try again."));
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 2, sm: 4, md: 6 },
      display: "grid", placeItems: "center",
      background: "radial-gradient(circle at top left,rgba(255,202,40,0.2),transparent 28%),radial-gradient(circle at bottom right,rgba(251,140,0,0.22),transparent 24%),linear-gradient(135deg,#0b0d12,#121821,#1d2633)",
    }}>
      <Card sx={{
        width: "100%", maxWidth: 1120, overflow: "hidden",
        borderRadius: { xs: 4, sm: 6, md: 8 },
        background: "linear-gradient(135deg,rgba(14,18,24,0.95),rgba(20,26,35,0.96))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: { xs: "0 16px 36px rgba(0,0,0,0.32)", md: "0 34px 80px rgba(0,0,0,0.45)" },
      }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.08fr 0.92fr" } }}>
          <Box sx={{
            position: "relative", px: { xs: 2.5, sm: 4, md: 8 }, py: { xs: 3, sm: 5, md: 8 }, color: "#f7f7f3",
            background: "linear-gradient(160deg,rgba(255,193,7,0.16),rgba(255,152,0,0.08) 46%,rgba(14,18,24,0))",
          }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <AirportShuttleRounded sx={{ color: "#ffd54f" }} />
              <Typography fontWeight={700} letterSpacing={0.6}>Savaari</Typography>
            </Box>

            <Typography variant="h2" sx={{ mt: { xs: 3, sm: 5 }, maxWidth: 460, fontSize: { xs: "2rem", sm: "2.6rem", md: "3.5rem" }, fontWeight: 800, lineHeight: 1.05 }}>
              Your next ride is only a tap away.
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 460, color: "rgba(255,255,255,0.72)", fontSize: { xs: "0.96rem", md: "1.05rem" }, lineHeight: 1.7 }}>
              Book everyday trips, airport runs, and late-night pickups with a faster, cleaner ride experience.
            </Typography>

            <Stack spacing={2} sx={{ mt: { xs: 3, sm: 5 }, maxWidth: 460, display: { xs: "none", sm: "flex" } }}>
              {FEATURES.map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2, borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ffca28", boxShadow: "0 0 18px rgba(255,202,40,0.65)" }} />
                  <Typography color="rgba(255,255,255,0.84)">{item}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 4, md: 6 } }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 420, mx: "auto", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography variant="overline" sx={{ color: "#ffd54f", fontWeight: 700, letterSpacing: 1.8, fontSize: "0.78rem" }}>Welcome back</Typography>
              <Typography variant="h4" sx={{ mt: 1, color: "#fffdf7", fontWeight: 800 }}>Sign in to your account</Typography>
              <Typography sx={{ mt: 1.5, mb: 4, color: "rgba(255,255,255,0.62)" }}>
                Sign in to book a ride or go online for your next pickup.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3, bgcolor: "rgba(211,47,47,0.14)", color: "#ffd8d8", border: "1px solid rgba(244,67,54,0.3)" }}>{error}</Alert>}

              <Stack spacing={2.5}>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={fieldSx} autoComplete="email"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailRounded sx={{ color: "rgba(255,255,255,0.5)" }} /></InputAdornment> } }} />

                <TextField fullWidth label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} sx={fieldSx} autoComplete="current-password"
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><LockRounded sx={{ color: "rgba(255,255,255,0.5)" }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" sx={{ color: "rgba(255,255,255,0.58)" }}>
                            {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }} />
              </Stack>

              <Button type="submit" fullWidth variant="contained" disabled={isLoading} endIcon={!isLoading ? <ArrowForwardRounded /> : null} sx={{ ...btnSx, mt: 4 }}>
                {isLoading ? <CircularProgress size={24} sx={{ color: "#111318" }} /> : "Sign In"}
              </Button>

              <Typography sx={{ mt: 3, textAlign: "center", color: "rgba(255,255,255,0.62)" }}>
                New here?{" "}
                <Box component={Link} to="/register" sx={{ color: "#ffd54f", fontWeight: 700 }}>Create an account</Box>
              </Typography>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;

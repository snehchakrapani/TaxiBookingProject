import { useEffect, useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  AppBar, Avatar, Box, Button, Chip, CircularProgress, Container, Divider, Drawer,
  IconButton, MenuItem, Stack, TextField, Toolbar, Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { CITIES } from "../constants/ride";
import { logout, selectUser, updateUser } from "../features/auth/authSlice";
import { useGetProfileQuery, useUpdateProfileMutation } from "../features/profile/profileApi";

const navButtonSx = {
  color: "rgba(255,255,255,0.92)",
  borderColor: "rgba(255,255,255,0.28)",
  textTransform: "none",
  fontWeight: 600,
  px: 2.5,
  py: 0.8,
  "&:hover": { borderColor: "#ffd54f", backgroundColor: "rgba(255,255,255,0.04)" },
};

const DashboardLayout = ({ title, subtitle, links = [], children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector(selectUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: profile } = useGetProfileQuery(undefined, { skip: !user });
  const [saveProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [form, setForm] = useState({ name: "", phone: "", cabType: "", vehicleName: "", vehicleNumber: "", city: "" });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      cabType: profile.cabType || "",
      vehicleName: profile.vehicleName || "",
      vehicleNumber: profile.vehicleNumber || "",
      city: profile.city || "",
    });
  }, [profile]);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const outstandingBalance = Number(profile?.outstandingBalance || 0);
  const balanceLabel = outstandingBalance > 0 ? `Account Balance: -₹${outstandingBalance.toFixed(2)}` : "Account Balance: ₹0.00";

  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(255,193,7,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(56,189,248,0.14), transparent 24%), linear-gradient(160deg, #0b0d12, #182338)" }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(9,12,22,0.82)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
        <Toolbar sx={{ gap: 2, py: 1.8, px: { xs: 2, sm: 3, md: 4 }, minHeight: { xs: 64, sm: 72 }, "&.MuiToolbar-root": { flexWrap: "wrap" } }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.4 }}>Savaari</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5} useFlexGap alignItems="center" sx={{ flexWrap: "wrap" }}>
            {links.map(({ label, to }) => (
              <Button
                key={to}
                size="small"
                variant={pathname === to ? "contained" : "outlined"}
                onClick={() => navigate(to)}
                sx={pathname === to ? { ...navButtonSx, bgcolor: "#ffb300", color: "#111318" } : navButtonSx}
              >
                {label}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => {
                dispatch(logout());
                navigate("/login", { replace: true });
              }}
              sx={{ ...navButtonSx, borderColor: "rgba(244,67,54,0.45)", color: "#ffcdd2" }}
            >
              Logout
            </Button>
            <Avatar
              onClick={() => setProfileOpen(true)}
              sx={{
                width: 40, height: 40, ml: 1, bgcolor: "#ffb300", color: "#111318", fontWeight: 800, fontSize: 16,
                cursor: "pointer", border: "2px solid rgba(255,255,255,0.18)", transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { boxShadow: "0 0 0 3px rgba(255,179,0,0.4)", transform: "scale(1.08)" },
              }}
            >
              {initials}
            </Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        PaperProps={{ sx: { width: { xs: "88vw", sm: 390 }, bgcolor: "#111827", borderLeft: "1px solid rgba(255,255,255,0.08)", p: 0 } }}
      >
        <Box sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>My Profile</Typography>
            <IconButton onClick={() => setProfileOpen(false)} sx={{ color: "rgba(255,255,255,0.5)" }}><CloseRoundedIcon /></IconButton>
          </Stack>

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar sx={{ width: 88, height: 88, bgcolor: "#ffb300", color: "#111318", fontWeight: 800, fontSize: 34, mx: "auto", mb: 2.5, border: "3px solid rgba(255,179,0,0.3)", boxShadow: "0 8px 32px rgba(255,179,0,0.2)" }}>
              {initials}
            </Avatar>
            <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{profile?.name || user?.name || "Guest"}</Typography>
            <Chip size="small" label={profile?.role || user?.role || "Guest"} sx={{ mt: 1.5, bgcolor: "rgba(255,179,0,0.15)", color: "#ffd54f", fontWeight: 700, fontSize: 12, px: 1 }} />
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(255,179,0,0.12)", display: "grid", placeItems: "center" }}>
                <PersonRoundedIcon sx={{ color: "#ffd54f", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, mb: 0.3 }}>Full Name</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{profile?.name || user?.name || "—"}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(56,189,248,0.12)", display: "grid", placeItems: "center" }}>
                <EmailRoundedIcon sx={{ color: "#38bdf8", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, mb: 0.3 }}>Email Address</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{profile?.email || user?.email || "—"}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "rgba(34,197,94,0.12)", display: "grid", placeItems: "center" }}>
                <BadgeRoundedIcon sx={{ color: "#4ade80", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, mb: 0.3 }}>Account Type</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{profile?.role || user?.role || "—"}</Typography>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 4 }} />

          <Stack spacing={2}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Profile Settings</Typography>
            <TextField label="Name" size="small" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Phone" size="small" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            {profile?.role === "Driver" && (
              <>
                <TextField select label="Cab Type" size="small" value={form.cabType} onChange={(e) => setForm((p) => ({ ...p, cabType: e.target.value }))}>
                  {["Mini", "Sedan", "SUV"].map((cab) => <MenuItem key={cab} value={cab}>{cab}</MenuItem>)}
                </TextField>
                <TextField label="Vehicle Name" size="small" value={form.vehicleName} onChange={(e) => setForm((p) => ({ ...p, vehicleName: e.target.value }))} />
                <TextField label="Vehicle Number" size="small" value={form.vehicleNumber} onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))} />
                <TextField select label="City" size="small" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}>
                  {CITIES.map((city) => <MenuItem key={city} value={city}>{city}</MenuItem>)}
                </TextField>
              </>
            )}
            {profile?.role === "User" && (
              <Chip label={balanceLabel} sx={{ width: "fit-content", bgcolor: "rgba(245,158,11,0.18)", color: "#fbbf24", fontWeight: 700 }} />
            )}
            <Button
              variant="contained"
              disabled={savingProfile}
              onClick={async () => {
                const updated = await saveProfile(form).unwrap();
                dispatch(updateUser({ name: updated.name, email: updated.email, role: updated.role }));
              }}
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              {savingProfile ? <CircularProgress size={18} /> : "Save Profile"}
            </Button>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 4 }} />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => {
              dispatch(logout());
              navigate("/login", { replace: true });
              setProfileOpen(false);
            }}
            sx={{ py: 1.5, borderRadius: 3, borderColor: "rgba(244,67,54,0.4)", color: "#f87171", fontWeight: 600, textTransform: "none", "&:hover": { borderColor: "#f87171", bgcolor: "rgba(244,67,54,0.08)" } }}
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 4, md: 8 } }}>
        <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(120deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))", boxShadow: "0 18px 42px rgba(3,7,18,0.28)", mb: { xs: 4, md: 6 } }}>
          <Typography variant="h4" sx={{ color: "#fffdf8", fontWeight: 800, fontSize: { xs: 24, sm: 28, md: 32 } }}>{title}</Typography>
          {subtitle && <Typography sx={{ color: "rgba(255,255,255,0.65)", mt: 1.5, fontSize: { xs: 14, md: 16 } }}>{subtitle}</Typography>}
        </Box>
        {children}
      </Container>
    </Box>
  );
};

export default DashboardLayout;

import { useState } from "react";
import {
  Box, Button, Card, CardContent, CircularProgress, Alert,
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem,
  Select, Stack, TextField, Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useRegisterUserMutation, useRegisterDriverMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { getApiError } from "../services/locationService";

const CITIES = ["Jaipur", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"];
const CAB_TYPES = [{ value: "Mini", label: "Mini (Hatchback)" }, { value: "Sedan", label: "Sedan" }, { value: "SUV", label: "SUV" }];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
    "&.Mui-error fieldset": { borderColor: "#ef4444" },
  },
  "& .MuiFormHelperText-root": { color: "#ef4444", fontSize: 11 },
};

const validators = {
  name:            (v) => v.trim().length >= 2 ? "" : "Name must be at least 2 characters",
  email:           (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email (e.g. user@example.com)",
  phone:           (v) => /^[6-9]\d{9}$/.test(v.trim()) ? "" : "Enter a valid 10-digit Indian mobile number",
  password:        (v) => v.length >= 6 ? "" : "Password must be at least 6 characters",
  confirmPassword: (v, pwd) => v === pwd ? "" : "Passwords do not match",
  vehicleName:     (v) => v.trim().length >= 2 ? "" : "Vehicle name must be at least 2 characters",
  vehicleNumber:   (v) => /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(v.trim().toUpperCase()) ? "" : "Format: XX00XX0000 e.g. RJ14CX4532",
};

const getStrength = (pwd) => {
  if (!pwd) return null;
  const types = [/[a-zA-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(pwd)).length;
  if (pwd.length < 6 || types < 2) return { label: "Weak",   color: "#ef4444", pct: "33%" };
  if (pwd.length >= 8 && types === 3) return { label: "Strong", color: "#22c55e", pct: "100%" };
  return { label: "Medium", color: "#f59e0b", pct: "66%" };
};

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [isDriver, setIsDriver] = useState(false);

  const [fields, setFields] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [driverFields, setDriverFields] = useState({ cabType: "Mini", vehicleName: "", vehicleNumber: "", city: "Jaipur" });

  const [touched,     setTouched]     = useState({});
  const [showPwd,     setShowPwd]     = useState(false);
  const [showCpwd,    setShowCpwd]    = useState(false);
  const [serverError, setServerError] = useState("");

  const [registerUser,   { isLoading: userLoading   }] = useRegisterUserMutation();
  const [registerDriver, { isLoading: driverLoading }] = useRegisterDriverMutation();
  const isLoading = userLoading || driverLoading;

  const strength = getStrength(fields.password);

  const getError = (field, value = fields[field] ?? driverFields[field] ?? "") =>
    field === "confirmPassword" ? validators.confirmPassword(value, fields.password) : validators[field]?.(value) ?? "";

  const hasError = (field) => !!touched[field] && !!getError(field);

  const handleChange = (field) => (e) => {
    const val = field === "vehicleNumber" ? e.target.value.toUpperCase() : e.target.value;
    field in fields ? setFields((f) => ({ ...f, [field]: val })) : setDriverFields((f) => ({ ...f, [field]: val }));
  };

  const fieldProps = (field) => ({
    value:      fields[field] ?? driverFields[field] ?? "",
    onChange:   handleChange(field),
    onBlur:     () => setTouched((t) => ({ ...t, [field]: true })),
    error:      hasError(field),
    helperText: hasError(field) ? getError(field) : "",
  });

  const isFormValid = () => {
    const all = ["name", "email", "password", "confirmPassword", "phone", ...(isDriver ? ["vehicleName", "vehicleNumber"] : [])];
    return all.every((f) => !getError(f, fields[f] ?? driverFields[f] ?? ""))
      && (strength?.label === "Medium" || strength?.label === "Strong");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const allFields = ["name", "email", "password", "confirmPassword", "phone", ...(isDriver ? ["vehicleName", "vehicleNumber"] : [])];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));
    if (!isFormValid()) return;

    try {
      const payload = { name: fields.name.trim(), email: fields.email.trim(), password: fields.password, phone: fields.phone.trim() };
      const result = isDriver
        ? await registerDriver({ ...payload, cabType: driverFields.cabType, vehicleName: driverFields.vehicleName.trim(), vehicleNumber: driverFields.vehicleNumber.trim().toUpperCase(), city: driverFields.city, latitude: 0, longitude: 0 }).unwrap()
        : await registerUser(payload).unwrap();
      dispatch(setCredentials(result));
      navigate(result.role === "Driver" ? "/driver" : "/book");
    } catch (err) {
      setServerError(getApiError(err, "Registration failed. Please try again."));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 20% 50%,#1a0533,#0a0a1a 60%,#001122)", py: 8, px: 3 }}>
      <Card sx={{ width: "100%", maxWidth: 560, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <CardContent sx={{ p: { xs: 3, sm: 5, md: 6 } }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🚖 Savaari
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14, mt: 1.5 }}>Create your account</Typography>
          </Box>

          <Box sx={{ display: "flex", bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, p: 0.5, mb: 4 }}>
            {["Rider", "Driver"].map((label, i) => {
              const active = isDriver ? i === 1 : i === 0;
              return (
                <Button key={label} fullWidth onClick={() => setIsDriver(i === 1)}
                  sx={{ py: 1.3, borderRadius: 2, fontSize: 15, fontWeight: 600, transition: "all 0.25s",
                    color: active ? "#0a0a1a" : "rgba(255,255,255,0.6)",
                    background: active ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "transparent",
                    "&:hover": { background: active ? undefined : "rgba(255,255,255,0.08)" },
                  }}>
                  {i === 0 ? "🧑 Rider" : "🚗 Driver"}
                </Button>
              );
            })}
          </Box>

          {serverError && <Alert severity="error" sx={{ mb: 3, bgcolor: "rgba(239,68,68,0.15)" }}>{serverError}</Alert>}

          <Stack component="form" onSubmit={handleSubmit} spacing={3}>
            <TextField label="Full Name"     fullWidth {...fieldProps("name")}  InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={inputSx} />
            <TextField label="Email Address" fullWidth {...fieldProps("email")} type="email" InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={inputSx} />
            <TextField label="Mobile Number" fullWidth {...fieldProps("phone")} inputProps={{ maxLength: 10 }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={inputSx} />

            <Box>
              <TextField label="Password" fullWidth type={showPwd ? "text" : "password"} {...fieldProps("password")}
                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPwd((v) => !v)} sx={{ color: "rgba(255,255,255,0.5)" }}>{showPwd ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
                sx={inputSx} />
              {fields.password && strength && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <Box sx={{ width: strength.pct, height: "100%", bgcolor: strength.color, borderRadius: 3, transition: "width 0.4s ease" }} />
                  </Box>
                  <Typography sx={{ fontSize: 11, mt: 0.5, color: strength.color, fontWeight: 600 }}>
                    {strength.label} password
                    {strength.label === "Weak"   && " — add numbers & special characters"}
                    {strength.label === "Medium" && " — add a special character to make it Strong"}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField label="Confirm Password" fullWidth type={showCpwd ? "text" : "password"} {...fieldProps("confirmPassword")}
              InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowCpwd((v) => !v)} sx={{ color: "rgba(255,255,255,0.5)" }}>{showCpwd ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
              sx={inputSx} />

            {isDriver && (
              <>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Cab Type</InputLabel>
                  <Select label="Cab Type" value={driverFields.cabType} onChange={(e) => setDriverFields((f) => ({ ...f, cabType: e.target.value }))} sx={{ color: "white" }}>
                    {CAB_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField label="Vehicle Name (e.g. Maruti Swift)" fullWidth
                  value={driverFields.vehicleName} onChange={handleChange("vehicleName")}
                  onBlur={() => setTouched((t) => ({ ...t, vehicleName: true }))}
                  error={!!touched.vehicleName && !!getError("vehicleName", driverFields.vehicleName)}
                  helperText={touched.vehicleName && getError("vehicleName", driverFields.vehicleName)}
                  InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={inputSx} />

                <TextField label="Vehicle Number (e.g. RJ14CX4532)" fullWidth inputProps={{ maxLength: 10 }}
                  value={driverFields.vehicleNumber} onChange={handleChange("vehicleNumber")}
                  onBlur={() => setTouched((t) => ({ ...t, vehicleNumber: true }))}
                  error={!!touched.vehicleNumber && !!getError("vehicleNumber", driverFields.vehicleNumber)}
                  helperText={touched.vehicleNumber && getError("vehicleNumber", driverFields.vehicleNumber)}
                  InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} sx={inputSx} />

                <FormControl fullWidth sx={inputSx}>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>City</InputLabel>
                  <Select label="City" value={driverFields.city} onChange={(e) => setDriverFields((f) => ({ ...f, city: e.target.value }))} sx={{ color: "white" }}>
                    {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            )}

            <Button type="submit" fullWidth disabled={isLoading}
              sx={{ py: 1.5, mt: 2, fontWeight: 700, fontSize: 15, borderRadius: 2, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#0a0a1a", "&:hover": { opacity: 0.9 }, "&:disabled": { opacity: 0.5 } }}>
              {isLoading ? <CircularProgress size={22} sx={{ color: "#0a0a1a" }} /> : "Create Account"}
            </Button>

            <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Already have an account?{" "}
              <Box component="a" href="/login" sx={{ color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>Sign in</Box>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

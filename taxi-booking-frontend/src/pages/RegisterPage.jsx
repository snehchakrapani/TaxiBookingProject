import { useEffect, useState } from "react";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocalTaxiRoundedIcon from "@mui/icons-material/LocalTaxiRounded";
import LocationCityRoundedIcon from "@mui/icons-material/LocationCityRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  useRegisterDriverMutation,
  useRegisterUserMutation,
} from "../features/auth/authApi";
import {
  selectIsLoggedIn,
  selectRole,
  setCredentials,
} from "../features/auth/authSlice";

const CITIES = [
  "Jaipur",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
];

const CITY_COORDINATES = {
  Jaipur: { latitude: 26.9124, longitude: 75.7873 },
  Delhi: { latitude: 28.6139, longitude: 77.209 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Bangalore: { latitude: 12.9716, longitude: 77.5946 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Pune: { latitude: 18.5204, longitude: 73.8567 },
  Kolkata: { latitude: 22.5726, longitude: 88.3639 },
};

const CAB_TYPES = ["Mini", "Sedan", "SUV"];

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#f6f7f8",
    backgroundColor: "rgba(13, 17, 23, 0.55)",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    "&:hover fieldset": {
      borderColor: "#ffd54f",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#ffb300",
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.68)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ffd54f",
  },
  "& .MuiSelect-icon": {
    color: "rgba(255,255,255,0.62)",
  },
};

const accentButtonSx = {
  py: { xs: 1.35, sm: 1.5 },
  borderRadius: { xs: 2.5, sm: 3 },
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "none",
  background:
    "linear-gradient(135deg, #ffca28 0%, #ffb300 50%, #fb8c00 100%)",
  color: "#111318",
  boxShadow: "0 16px 28px rgba(251, 140, 0, 0.28)",
  "&:hover": {
    background:
      "linear-gradient(135deg, #ffd54f 0%, #ffb300 55%, #f57c00 100%)",
    boxShadow: "0 18px 32px rgba(251, 140, 0, 0.34)",
  },
  "&:disabled": {
    color: "rgba(17,19,24,0.72)",
    background: "linear-gradient(135deg, #ffe082 0%, #ffca28 100%)",
  },
};

const getDestination = (role) => (role === "Driver" ? "/driver" : "/book");

const getErrorMessage = (error) =>
  error?.data?.message ||
  error?.data?.title ||
  "Registration failed. Please try again.";

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const currentRole = useSelector(selectRole);
  const [role, setRole] = useState("User");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cabType, setCabType] = useState("Sedan");
  const [city, setCity] = useState("Jaipur");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [registerUser, { isLoading: userLoading }] = useRegisterUserMutation();
  const [registerDriver, { isLoading: driverLoading }] =
    useRegisterDriverMutation();
  const isLoading = userLoading || driverLoading;

  useEffect(() => {
    if (isLoggedIn) {
      navigate(getDestination(currentRole), { replace: true });
    }
  }, [currentRole, isLoggedIn, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !phone.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      let result;

      if (role === "Driver") {
        const coordinates = CITY_COORDINATES[city];
        result = await registerDriver({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          cabType,
          city,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }).unwrap();
      } else {
        result = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
        }).unwrap();
      }

      dispatch(setCredentials(result));
      navigate(getDestination(result.role), { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 1.25, sm: 2, md: 3 },
        py: { xs: 1.25, sm: 3, md: 4 },
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top right, rgba(255,202,40,0.18), transparent 22%), radial-gradient(circle at bottom left, rgba(251,140,0,0.22), transparent 26%), linear-gradient(160deg, #0b0d12 0%, #10161f 44%, #182231 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1180,
          overflow: "hidden",
          borderRadius: { xs: 4, sm: 6, md: 8 },
          background:
            "linear-gradient(135deg, rgba(14,18,24,0.95) 0%, rgba(20,26,35,0.96) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: {
            xs: "0 16px 36px rgba(0,0,0,0.32)",
            md: "0 34px 80px rgba(0,0,0,0.45)",
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.95fr 1.05fr" },
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 5 },
              py: { xs: 2.5, sm: 4, md: 5.5 },
              color: "#fffdf7",
              background:
                "linear-gradient(160deg, rgba(255,193,7,0.17) 0%, rgba(255,152,0,0.08) 48%, rgba(14,18,24,0) 100%)",
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.8, sm: 1 },
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <AirportShuttleRoundedIcon sx={{ color: "#ffd54f" }} />
              <Typography fontWeight={700} letterSpacing={0.6}>
                Savaari
              </Typography>
            </Box>

            <Typography
              variant="h3"
              sx={{
                mt: { xs: 2.5, sm: 4 },
                fontSize: { xs: "1.9rem", sm: "2.4rem", md: "3.1rem" },
                fontWeight: 800,
                lineHeight: 1.05,
              }}
            >
              One app for every trip and every shift.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "rgba(255,255,255,0.72)",
                lineHeight: { xs: 1.6, md: 1.75 },
                fontSize: { xs: "0.96rem", sm: "1rem" },
                maxWidth: 430,
              }}
            >
              Join as a rider for quick bookings, or sign up as a driver and
              start accepting trips with confidence.
            </Typography>

            <Stack
              spacing={1.5}
              sx={{ mt: { xs: 2.5, sm: 4 }, maxWidth: 430, display: { xs: "none", sm: "flex" } }}
            >
              {[
                "Quick signup for riders who want a cab without the wait",
                "Driver onboarding with city and cab setup built in",
                "A polished mobile-ready experience from the first screen",
              ].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#ffca28",
                      boxShadow: "0 0 18px rgba(255,202,40,0.65)",
                    }}
                  />
                  <Typography color="rgba(255,255,255,0.84)">{item}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                maxWidth: 470,
                mx: "auto",
                py: { xs: 0.5, sm: 1, md: 0 },
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "#ffd54f",
                  fontWeight: 700,
                  letterSpacing: { xs: 1.4, sm: 1.8 },
                  fontSize: { xs: "0.68rem", sm: "0.78rem" },
                }}
              >
                Join Savaari
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  color: "#fffdf7",
                  fontWeight: 800,
                  fontSize: { xs: "1.8rem", sm: "2.125rem" },
                }}
              >
                Create your account
              </Typography>
              <Typography
                sx={{
                  mt: 1.2,
                  mb: { xs: 2.25, sm: 3 },
                  color: "rgba(255,255,255,0.62)",
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                }}
              >
                Pick how you use Savaari today and get moving in just a minute.
              </Typography>

              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={(_, value) => {
                  if (value) {
                    setRole(value);
                  }
                }}
                fullWidth
                sx={{
                  mb: 2.25,
                  p: 0.5,
                  borderRadius: { xs: 3, sm: 4 },
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "& .MuiToggleButtonGroup-grouped": {
                    border: 0,
                  },
                  "& .MuiToggleButton-root": {
                    fontSize: { xs: "0.82rem", sm: "0.95rem" },
                  },
                }}
              >
                <ToggleButton
                  value="User"
                  sx={{
                    py: { xs: 1, sm: 1.2 },
                    borderRadius: "14px !important",
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: 700,
                    textTransform: "none",
                    "&.Mui-selected": {
                      color: "#111318",
                      background:
                        "linear-gradient(135deg, #ffca28 0%, #ffb300 100%)",
                    },
                  }}
                >
                  <PersonRoundedIcon sx={{ mr: 1 }} />
                  Rider
                </ToggleButton>
                <ToggleButton
                  value="Driver"
                  sx={{
                    py: { xs: 1, sm: 1.2 },
                    borderRadius: "14px !important",
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: 700,
                    textTransform: "none",
                    "&.Mui-selected": {
                      color: "#111318",
                      background:
                        "linear-gradient(135deg, #ffca28 0%, #ffb300 100%)",
                    },
                  }}
                >
                  <DirectionsCarFilledRoundedIcon sx={{ mr: 1 }} />
                  Driver
                </ToggleButton>
              </ToggleButtonGroup>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2.25,
                    borderRadius: 3,
                    bgcolor: "rgba(211, 47, 47, 0.14)",
                    color: "#ffd8d8",
                    border: "1px solid rgba(244,67,54,0.3)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Stack spacing={{ xs: 1.8, sm: 2.1 }}>
                <TextField
                  fullWidth
                  label="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  sx={fieldStyles}
                  autoComplete="name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  sx={fieldStyles}
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  sx={fieldStyles}
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((current) => !current)}
                          edge="end"
                          sx={{ color: "rgba(255,255,255,0.58)" }}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon />
                          ) : (
                            <VisibilityRoundedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  sx={fieldStyles}
                  autoComplete="tel"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRoundedIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {role === "Driver" && (
                  <>
                    <TextField
                      fullWidth
                      select
                      label="Cab type"
                      value={cabType}
                      onChange={(event) => setCabType(event.target.value)}
                      sx={fieldStyles}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              borderRadius: 3,
                            },
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalTaxiRoundedIcon
                              sx={{ color: "rgba(255,255,255,0.5)" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {CAB_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      select
                      label="City"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      sx={fieldStyles}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              borderRadius: 3,
                            },
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationCityRoundedIcon
                              sx={{ color: "rgba(255,255,255,0.5)" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {CITIES.map((cityName) => (
                        <MenuItem key={cityName} value={cityName}>
                          {cityName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  ...accentButtonSx,
                  mt: { xs: 2.5, sm: 3 },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: "#111318" }} />
                ) : role === "Driver" ? (
                  "Register as Driver"
                ) : (
                  "Create Rider Account"
                )}
              </Button>

              <Typography
                sx={{
                  mt: 2.25,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.62)",
                  fontSize: { xs: "0.92rem", sm: "1rem" },
                }}
              >
                Already have an account?{" "}
                <Box
                  component={Link}
                  to="/login"
                  sx={{
                    color: "#ffd54f",
                    fontWeight: 700,
                  }}
                >
                  Sign in
                </Box>
              </Typography>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default RegisterPage;

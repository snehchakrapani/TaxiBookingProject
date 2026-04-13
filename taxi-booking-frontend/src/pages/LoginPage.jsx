import { useEffect, useState } from "react";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/authApi";
import {
  selectIsLoggedIn,
  selectRole,
  setCredentials,
} from "../features/auth/authSlice";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#f6f7f8",
    backgroundColor: "rgba(13, 17, 23, 0.5)",
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
  "Login failed. Please try again.";

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
    if (isLoggedIn) {
      navigate(getDestination(role), { replace: true });
    }
  }, [isLoggedIn, navigate, role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      }).unwrap();

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
          "radial-gradient(circle at top left, rgba(255,202,40,0.2), transparent 28%), radial-gradient(circle at bottom right, rgba(251,140,0,0.22), transparent 24%), linear-gradient(135deg, #0b0d12 0%, #121821 45%, #1d2633 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1120,
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
            gridTemplateColumns: { xs: "1fr", md: "1.08fr 0.92fr" },
          }}
        >
          <Box
            sx={{
              position: "relative",
              px: { xs: 2, sm: 3, md: 6 },
              py: { xs: 2.5, sm: 4, md: 6 },
              color: "#f7f7f3",
              background:
                "linear-gradient(160deg, rgba(255,193,7,0.16) 0%, rgba(255,152,0,0.08) 46%, rgba(14,18,24,0) 100%)",
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
              variant="h2"
              sx={{
                mt: { xs: 2.5, sm: 4 },
                maxWidth: 460,
                fontSize: { xs: "2rem", sm: "2.6rem", md: "3.5rem" },
                fontWeight: 800,
                lineHeight: { xs: 1.05, md: 1.02 },
              }}
            >
              Your next ride is only a tap away.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                maxWidth: 460,
                color: "rgba(255,255,255,0.72)",
                fontSize: { xs: "0.96rem", sm: "1rem", md: "1.05rem" },
                lineHeight: { xs: 1.6, md: 1.7 },
              }}
            >
              Book everyday trips, airport runs, and late-night pickups with a
              faster, cleaner ride experience.
            </Typography>

            <Stack
              spacing={1.5}
              sx={{
                mt: { xs: 2.5, sm: 4 },
                maxWidth: 460,
                display: { xs: "none", sm: "flex" },
              }}
            >
              {[
                "Book rides in seconds with a clean, familiar flow",
                "Track your trip and driver updates in one place",
                "Built for riders and drivers moving across the city",
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
                maxWidth: 420,
                mx: "auto",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
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
                Welcome back
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
                Sign in to your account
              </Typography>
              <Typography
                sx={{
                  mt: 1.2,
                  mb: { xs: 2.25, sm: 3 },
                  color: "rgba(255,255,255,0.62)",
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                }}
              >
                Sign in to book a ride or go online for your next pickup.
              </Typography>

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

              <Stack spacing={{ xs: 1.8, sm: 2.2 }}>
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
                  autoComplete="current-password"
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
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                endIcon={!isLoading ? <ArrowForwardRoundedIcon /> : null}
                sx={{
                  ...accentButtonSx,
                  mt: { xs: 2.5, sm: 3 },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: "#111318" }} />
                ) : (
                  "Sign In"
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
                New here?{" "}
                <Box
                  component={Link}
                  to="/register"
                  sx={{
                    color: "#ffd54f",
                    fontWeight: 700,
                  }}
                >
                  Create an account
                </Box>
              </Typography>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;

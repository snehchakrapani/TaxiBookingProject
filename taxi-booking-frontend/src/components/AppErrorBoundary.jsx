import { Component } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorText: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorText: error?.message || "Unexpected app error." };
  }

  componentDidCatch(error) {
    console.error("App render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            p: 2,
            background: "#0b0f19",
          }}
        >
          <Stack spacing={1.5} sx={{ textAlign: "center", maxWidth: 520 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Something went wrong
            </Typography>
            <Typography color="text.secondary">{this.state.errorText}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;


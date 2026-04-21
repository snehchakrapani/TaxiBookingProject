import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useGetRideHistoryQuery } from "../features/booking/bookingApi";
import { STATUS_COLOR, getApiError } from "../constants/ride";

const RideHistoryPage = () => {
  const navigate = useNavigate();
  const { data = [], isLoading, isError, error } = useGetRideHistoryQuery();

  const layoutProps = {
    title: "Ride History",
    subtitle: "All your past and active rides in one clean timeline.",
    links: [{ label: "Book", to: "/book" }, { label: "History", to: "/history" }],
  };

  if (isLoading) return (
    <DashboardLayout {...layoutProps}>
      <Card sx={{ borderRadius: 4 }}><CardContent>Loading ride history...</CardContent></Card>
    </DashboardLayout>
  );

  if (isError) return (
    <DashboardLayout {...layoutProps}>
      <Alert severity="error">{getApiError(error, "Unable to load ride history.")}</Alert>
    </DashboardLayout>
  );

  if (data.length === 0) return (
    <DashboardLayout {...layoutProps}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography sx={{ mb: 1 }}>No rides yet.</Typography>
          <Typography variant="body2" color="text.secondary">Book your first trip to see it appear here.</Typography>
        </CardContent>
      </Card>
    </DashboardLayout>
  );

  return (
    <DashboardLayout {...layoutProps}>
      <Grid container spacing={{ xs: 4, md: 6 }}>
        {data.map((ride) => (
          <Grid key={ride.bookingId} size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 5, height: "100%", border: "1px solid rgba(255,255,255,0.08)" }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>#{ride.bookingId}</Typography>
                  <Chip size="small" label={ride.status} color={STATUS_COLOR[ride.status] || "default"} />
                </Stack>

                <Stack spacing={2}>
                  <Typography sx={{ fontSize: 14 }}><strong>Pickup:</strong> {ride.pickupLocation}</Typography>
                  <Typography sx={{ fontSize: 14 }}><strong>Drop:</strong> {ride.dropLocation}</Typography>
                  <Typography sx={{ fontSize: 14 }}><strong>Cab:</strong> {ride.cabType}</Typography>
                  <Typography sx={{ fontSize: 14 }}><strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber})</Typography>
                  <Typography sx={{ fontSize: 14 }}><strong>Driver:</strong> {ride.driverName}</Typography>
                  <Typography sx={{ fontSize: 14 }}><strong>Fare:</strong> Rs. {ride.fare}</Typography>
                  <Typography variant="body2" color="text.secondary">{new Date(ride.bookedAt).toLocaleString()}</Typography>
                </Stack>

                <Box sx={{ mt: 3 }}>
                  <Typography onClick={() => navigate(`/ride-status/${ride.bookingId}`)}
                    sx={{ color: "#fbbf24", fontWeight: 600, cursor: "pointer", width: "fit-content", fontSize: 14, "&:hover": { textDecoration: "underline" } }}>
                    Open details →
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardLayout>
  );
};

export default RideHistoryPage;

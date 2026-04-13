import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectToken } from "../auth/authSlice";

export const driverApi = createApi({
  reducerPath: "driverApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectToken(getState());
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["DriverBooking"],
  endpoints: (builder) => ({
    getPendingRequests: builder.query({
      query: () => "/api/Driver/requests",
      providesTags: ["DriverBooking"],
      keepUnusedDataFor: 0,
    }),
    acceptBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/api/Driver/accept/${bookingId}`,
        method: "PUT",
      }),
      invalidatesTags: ["DriverBooking"],
    }),
    declineBooking: builder.mutation({
      query: (bookingId) => ({
        url: `/api/Driver/decline/${bookingId}`,
        method: "PUT",
      }),
      invalidatesTags: ["DriverBooking"],
    }),
    updateLocation: builder.mutation({
      query: (data) => ({
        url: "/api/Driver/location",
        method: "PUT",
        body: data,
      }),
    }),
    updateAvailability: builder.mutation({
      query: (data) => ({
        url: "/api/Driver/availability",
        method: "PUT",
        body: data,
      }),
    }),
    verifyStartOtp: builder.mutation({
      query: (data) => ({
        url: "/api/Driver/verify-start-otp",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DriverBooking"],
    }),
    completeRide: builder.mutation({
      query: (bookingId) => ({
        url: `/api/Driver/complete/${bookingId}`,
        method: "PUT",
      }),
      invalidatesTags: ["DriverBooking"],
    }),
  }),
});

export const {
  useGetPendingRequestsQuery,
  useAcceptBookingMutation,
  useDeclineBookingMutation,
  useUpdateLocationMutation,
  useUpdateAvailabilityMutation,
  useVerifyStartOtpMutation,
  useCompleteRideMutation,
} = driverApi;

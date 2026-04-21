import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectToken } from "../auth/authSlice";
import { API_BASE_URL } from "../../config/api";

export const bookingApi = createApi({
  reducerPath: "bookingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectToken(getState());
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Booking"],
  endpoints: (builder) => ({
    bookRide: builder.mutation({
      query: (data) => ({ url: "/api/Booking/book", method: "POST", body: data }),
      invalidatesTags: ["Booking"],
    }),
    getBookingStatus: builder.query({
      query: (id) => `/api/Booking/${id}`,
      providesTags: ["Booking"],
      keepUnusedDataFor: 0,
    }),
    cancelBooking: builder.mutation({
      query: (data) => ({ url: "/api/Booking/cancel", method: "PUT", body: data }),
      invalidatesTags: ["Booking"],
    }),
    getRideHistory: builder.query({
      query: () => "/api/Booking/history",
      providesTags: ["Booking"],
    }),
    setPaymentMode: builder.mutation({
      query: (data) => ({ url: "/api/Booking/payment-mode", method: "PUT", body: data }),
      invalidatesTags: ["Booking"],
    }),
    rateDriver: builder.mutation({
      query: (data) => ({ url: "/api/Booking/rate", method: "PUT", body: data }),
      invalidatesTags: ["Booking"],
    }),
    getNearbyDrivers: builder.query({
      query: (city) => `/api/Booking/nearby-drivers?city=${encodeURIComponent(city)}`,
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useBookRideMutation,
  useGetBookingStatusQuery,
  useCancelBookingMutation,
  useGetRideHistoryQuery,
  useSetPaymentModeMutation,
  useRateDriverMutation,
  useGetNearbyDriversQuery,
} = bookingApi;

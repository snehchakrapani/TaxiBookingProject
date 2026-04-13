import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectToken } from "../auth/authSlice";

export const bookingApi = createApi({
  reducerPath: "bookingApi",
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
  tagTypes: ["Booking"],
  endpoints: (builder) => ({
    bookRide: builder.mutation({
      query: (data) => ({
        url: "/api/Booking/book",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Booking"],
    }),
    getBookingStatus: builder.query({
      query: (id) => `/api/Booking/${id}`,
      providesTags: ["Booking"],
      keepUnusedDataFor: 0,
    }),
    cancelBooking: builder.mutation({
      query: (data) => ({
        url: "/api/Booking/cancel",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Booking"],
    }),
    getRideHistory: builder.query({
      query: () => "/api/Booking/history",
      providesTags: ["Booking"],
    }),
  }),
});

export const {
  useBookRideMutation,
  useGetBookingStatusQuery,
  useCancelBookingMutation,
  useGetRideHistoryQuery,
} = bookingApi;

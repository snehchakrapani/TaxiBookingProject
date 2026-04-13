import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (data) => ({
        url: "/api/Auth/register/user",
        method: "POST",
        body: data,
      }),
    }),
    registerDriver: builder.mutation({
      query: (data) => ({
        url: "/api/Auth/register/driver",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/api/Auth/login",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useRegisterDriverMutation,
  useLoginMutation,
} = authApi;

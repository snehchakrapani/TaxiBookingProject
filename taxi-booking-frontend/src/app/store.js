import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";
import authReducer from "../features/auth/authSlice";
import { bookingApi } from "../features/booking/bookingApi";
import { driverApi } from "../features/driver/driverApi";
import { profileApi } from "../features/profile/profileApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [driverApi.reducerPath]: driverApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(bookingApi.middleware)
      .concat(driverApi.middleware)
      .concat(profileApi.middleware),
});

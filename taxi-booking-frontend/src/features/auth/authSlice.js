import { createSlice } from "@reduxjs/toolkit";

const savedToken = localStorage.getItem("token");
const savedUser = JSON.parse(localStorage.getItem("user") || "null");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: savedToken || null,
    user: savedUser || null,
    isLoggedIn: !!savedToken,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { token, name, email, role } = action.payload;
      state.token = token;
      state.user = { name, email, role };
      state.isLoggedIn = true;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ name, email, role }));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectRole = (state) => state.auth.user?.role;

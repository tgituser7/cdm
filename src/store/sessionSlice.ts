import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ApiError, apiFetch } from "@/lib/api";
import type { Location, Role, User } from "@/lib/types";
import { feedApi } from "./feedApi";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  mobile?: string;
  bio?: string;
  location?: Location;
}

interface Rejected {
  message: string;
  fields?: Record<string, string>;
}

interface SessionState {
  user: User | null;
  /** "loading" until the first /me check finishes */
  status: "loading" | "ready";
  locationPromptOpen: boolean;
}

const initialState: SessionState = { user: null, status: "loading", locationPromptOpen: false };

const toRejected = (e: unknown): Rejected =>
  e instanceof ApiError ? { message: e.message, fields: e.fields } : { message: "Something went wrong" };

export const fetchSession = createAsyncThunk("session/fetch", async () => {
  try {
    return (await apiFetch<{ user: User | null }>("/auth/me")).user;
  } catch {
    return null;
  }
});

export const login = createAsyncThunk<User, { email: string; password: string; remember: boolean }, { rejectValue: Rejected }>(
  "session/login",
  async (body, { rejectWithValue, dispatch }) => {
    try {
      const { user } = await apiFetch<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) });
      dispatch(feedApi.util.invalidateTags(["Feeds"]));
      return user;
    } catch (e) {
      return rejectWithValue(toRejected(e));
    }
  },
);

export const signup = createAsyncThunk<User, SignupInput, { rejectValue: Rejected }>(
  "session/signup",
  async (body, { rejectWithValue, dispatch }) => {
    try {
      const { user } = await apiFetch<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(body) });
      dispatch(feedApi.util.invalidateTags(["Feeds"]));
      return user;
    } catch (e) {
      return rejectWithValue(toRejected(e));
    }
  },
);

export const logout = createAsyncThunk("session/logout", async (_, { dispatch }) => {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  dispatch(feedApi.util.invalidateTags(["Feeds"]));
});

export const saveLocation = createAsyncThunk<User, Location, { rejectValue: Rejected }>(
  "session/saveLocation",
  async (loc, { rejectWithValue, dispatch }) => {
    try {
      const { user } = await apiFetch<{ user: User }>("/auth/me/location", { method: "PATCH", body: JSON.stringify(loc) });
      dispatch(feedApi.util.invalidateTags(["Feeds"]));
      return user;
    } catch (e) {
      return rejectWithValue(toRejected(e));
    }
  },
);

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    openLocationPrompt: (s) => {
      s.locationPromptOpen = true;
    },
    closeLocationPrompt: (s) => {
      s.locationPromptOpen = false;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSession.fulfilled, (s, a) => {
      s.user = a.payload;
      s.status = "ready";
      // Audience members without a saved location are asked for it right away.
      s.locationPromptOpen = a.payload?.role === "audience" && !a.payload.location?.city;
    });
    b.addCase(login.fulfilled, (s, a) => {
      s.user = a.payload;
      s.locationPromptOpen = a.payload.role === "audience" && !a.payload.location?.city;
    });
    b.addCase(signup.fulfilled, (s, a) => {
      s.user = a.payload;
      s.locationPromptOpen = a.payload.role === "audience" && !a.payload.location?.city;
    });
    b.addCase(logout.fulfilled, (s) => {
      s.user = null;
      s.locationPromptOpen = false;
    });
    b.addCase(saveLocation.fulfilled, (s, a) => {
      s.user = a.payload;
      s.locationPromptOpen = false;
    });
  },
});

export const { openLocationPrompt, closeLocationPrompt } = sessionSlice.actions;
export default sessionSlice.reducer;

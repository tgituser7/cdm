import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { feedApi } from "./feedApi";
import session from "./sessionSlice";

// Combined once at module load: combineReducers uses Math.random for its shape check,
// which Next.js doesn't allow during a prerendered render.
const rootReducer = combineReducers({
  session,
  [feedApi.reducerPath]: feedApi.reducer,
});

export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(feedApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];

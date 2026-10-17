"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { fetchSession } from "@/store/sessionSlice";
import LocationPrompt from "./LocationPrompt";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);

  useEffect(() => {
    store.dispatch(fetchSession());
  }, [store]);

  return (
    <Provider store={store}>
      {children}
      <LocationPrompt />
    </Provider>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { formatDate, timeAgo } from "@/lib/format";

const noopSubscribe = () => () => {};

/** Relative time ("3d ago"); falls back to an absolute date while prerendering. */
export default function TimeAgo({ iso }: { iso: string }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return <time dateTime={iso}>{mounted ? timeAgo(iso) : formatDate(iso)}</time>;
}

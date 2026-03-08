"use client";

import { useEffect, useRef, useCallback } from "react";
import { WSEvent } from "@/lib/types";

type Handler = (event: WSEvent) => void;

export function useWebSocket(onEvent: Handler) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
    const url = `${apiUrl}/events`;

    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(url);

    es.onopen = () => {
      console.log("[SSE] Connected to Anique's Organization backend");
    };

    es.onmessage = (evt) => {
      if (!evt.data || evt.data.trim() === "") return;
      try {
        const data = JSON.parse(evt.data) as WSEvent;
        onEventRef.current(data);
      } catch (e) {
        console.error("[SSE] Failed to parse message", e, evt.data);
      }
    };

    es.onerror = () => {
      console.log("[SSE] Connection error — reconnecting in 3s...");
      es.close();
      esRef.current = null;
      setTimeout(connect, 3000);
    };

    esRef.current = es;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return esRef;
}

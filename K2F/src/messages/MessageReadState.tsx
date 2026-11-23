import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { isUnreadFor, type MessageViewer, type MockMessage } from "./mockMessageCoachClient";
import { createReadMarkerStore } from "./readMarkers";

const markers = createReadMarkerStore(AsyncStorage);

export function useFirstUnreadIndex(messages: MockMessage[], viewer: MessageViewer, storageKey: string) {
  const [read, setRead] = useState<Set<string> | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useFocusEffect(useCallback(() => {
    let focused = true;
    setRead(null);
    markers.load(storageKey).then(
      (ids) => { if (focused) setRead(ids); },
      () => { if (focused) setRead(null); },
    );
    return () => {
      focused = false;
      const viewed = messagesRef.current.filter((message) => isUnreadFor(message, viewer)).map((message) => message.id);
      markers.markViewed(storageKey, viewed).catch(() => console.warn("Message read markers could not be saved."));
    };
  }, [storageKey, viewer]));

  return read ? messages.findIndex((message) => isUnreadFor(message, viewer) && !read.has(message.id)) : -1;
}

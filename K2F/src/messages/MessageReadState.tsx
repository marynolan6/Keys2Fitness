import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    isUnreadFor,
    type MessageViewer,
    type MockMessage,
} from "@/messages/mockMessageCoachClient";


type UseReadMessagesProps = {
    messages: MockMessage[];
    viewer: MessageViewer;
    storageKey: string;
};

export function useReadState({
    messages,
    viewer,
    storageKey,
}: UseReadMessagesProps) {
    const [readMessageIds, setReadMessageIds] = useState<string[]>([]);
    const [readStateLoaded, setReadStateLoaded] = useState(false);



    const messagesRef = useRef<MockMessage[]>(messages);
    const readIdsRef = useRef<string[]>([]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        readIdsRef.current = readMessageIds;
    }, [readMessageIds]);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            AsyncStorage.getItem(storageKey)
                .then((saved) => {
                    if (!active) return;

                    const savedIds: string[] = saved ? JSON.parse(saved) : [];

                    readIdsRef.current = savedIds;
                    setReadMessageIds(savedIds);
                    setReadStateLoaded(true);
                })
                .catch(() => {
                    if (active) setReadStateLoaded(true);
                });

            return () => {
                active = false;

                const viewedMessageIds = messagesRef.current
                    .filter((message) => isUnreadFor(message, viewer))
                    .map((message) => message.id);

                const allReadIds = [
                    ...new Set([
                        ...readIdsRef.current,
                        ...viewedMessageIds,
                    ]),
                ];

                void AsyncStorage.setItem(
                    storageKey,
                    JSON.stringify(allReadIds),
                );
            };
        }, [storageKey, viewer]),
    );

    const isUnread = useCallback(
        (message: MockMessage) =>
            readStateLoaded &&
            isUnreadFor(message, viewer) &&
            !readMessageIds.includes(message.id),
        [readMessageIds, readStateLoaded, viewer],
    );

    return {
        isUnread,
        readStateLoaded,
    };
}
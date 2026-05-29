export interface MockMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface MockConversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: MockMessage[];
}

export const mockConversations: MockConversation[] = [
  {
    id: "c1",
    participantIds: ["u2"],
    lastMessage: "Thanks for helping with the cleanup!",
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    unread: 1,
    messages: [
      {
        id: "msg1",
        senderId: "demo-resident",
        content: "Hey Sarah! I'll bring extra gloves on Saturday.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        read: true,
      },
      {
        id: "msg2",
        senderId: "u2",
        content: "That's amazing, thank you! See you at 9 AM.",
        createdAt: new Date(Date.now() - 82800000).toISOString(),
        read: true,
      },
      {
        id: "msg3",
        senderId: "u2",
        content: "Thanks for helping with the cleanup!",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        read: false,
      },
    ],
  },
  {
    id: "c2",
    participantIds: ["u3"],
    lastMessage: "Any update on Buddy?",
    lastMessageAt: new Date(Date.now() - 14400000).toISOString(),
    unread: 0,
    messages: [
      {
        id: "msg4",
        senderId: "u3",
        content: "Has anyone seen a golden retriever near Cedar Park?",
        createdAt: new Date(Date.now() - 28800000).toISOString(),
        read: true,
      },
      {
        id: "msg5",
        senderId: "demo-resident",
        content: "I'll keep an eye out during my walk tonight.",
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        read: true,
      },
      {
        id: "msg6",
        senderId: "u3",
        content: "Any update on Buddy?",
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        read: true,
      },
    ],
  },
  {
    id: "c3",
    participantIds: ["demo-admin"],
    lastMessage: "Welcome to Community Connect!",
    lastMessageAt: new Date(Date.now() - 604800000).toISOString(),
    unread: 0,
    messages: [
      {
        id: "msg7",
        senderId: "demo-admin",
        content: "Welcome to Community Connect! Let us know if you need anything.",
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        read: true,
      },
    ],
  },
];

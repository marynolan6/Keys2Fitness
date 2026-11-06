export type MessageViewer = "client" | "coach";
export const mockCoachTyping = true;
export type MockMessage = {
  id: string;
  clientId: string;
  clientName: string;
  sender: string;
  message: string;
  createdAt: string;
  senderType: "client" | "coach";
  unreadFor?: MessageViewer;
};

export const mockMessages: MockMessage[] = [

  {
    id: "spencer-1",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "Can you check my workout?",
    createdAt: "2026-11-03T08:30:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-2",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "Yes, your form is looking much better.",
    createdAt: "2026-11-03T08:45:00",
    senderType: "coach",
  },
  {
    id: "spencer-3",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "I finished today's workout.",
    createdAt: "2026-11-03T09:30:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-4",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "Great job. Keep up the good work.",
    createdAt: "2026-11-03T10:15:00",
    senderType: "coach",
    unreadFor: "client",
  },
  {
    id: "spencer-5",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "Should I increase the weight next time?",
    createdAt: "2026-11-03T11:00:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-6",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "Increase it a little if your form stays controlled.",
    createdAt: "2026-11-03T12:10:00",
    senderType: "coach",
    unreadFor: "client",
  },
  {
    id: "spencer-7",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "Got it. I will try that.",
    createdAt: "2026-11-02T09:15:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-8",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "Good luck with tomorrow's workout!",
    createdAt: "2026-11-02T10:30:00",
    senderType: "coach",
  },
  {
    id: "spencer-9",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "Thanks, Coach!",
    createdAt: "2026-10-31T14:00:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-10",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "Keep following your workout plan.",
    createdAt: "2026-10-31T15:00:00",
    senderType: "coach",
  },
  {
    id: "spencer-11",
    clientId: "1",
    clientName: "Spencer",
    sender: "Spencer",
    message: "I uploaded my workout video.",
    createdAt: "2026-10-20T09:00:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "spencer-12",
    clientId: "1",
    clientName: "Spencer",
    sender: "Coach Keys",
    message: "I will review it soon.",
    createdAt: "2026-10-20T10:00:00",
    senderType: "coach",
  },

  // Alex Morgan conversation
  {
    id: "alex-1",
    clientId: "2",
    clientName: "Alex Morgan",
    sender: "Alex Morgan",
    message: "Can you check my meal plan?",
    createdAt: "2026-11-03T09:00:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "alex-2",
    clientId: "2",
    clientName: "Alex Morgan",
    sender: "Coach Keys",
    message: "Yes, I will review it today.",
    createdAt: "2026-11-03T09:20:00",
    senderType: "coach",
  },

  // Jordan Lee conversation
  {
    id: "jordan-1",
    clientId: "3",
    clientName: "Jordan Lee",
    sender: "Jordan Lee",
    message: "I have a question about my plan.",
    createdAt: "2026-11-03T10:00:00",
    senderType: "client",
    unreadFor: "coach",
  },
  {
    id: "jordan-2",
    clientId: "3",
    clientName: "Jordan Lee",
    sender: "Coach Keys",
    message: "Sure, what do you need help with?",
    createdAt: "2026-11-03T10:30:00",
    senderType: "coach",
  },
  {
  id: "alex-3",
  clientId: "2",
  clientName: "Alex Morgan",
  sender: "Alex Morgan",
  message: "I also completed my morning walk.",
  createdAt: "2026-11-02T08:30:00",
  senderType: "client",
  unreadFor: "coach",
},
{
  id: "alex-4",
  clientId: "2",
  clientName: "Alex Morgan",
  sender: "Coach Keys",
  message: "That is great progress. Keep it consistent.",
  createdAt: "2026-11-02T09:15:00",
  senderType: "coach",
},
{
  id: "alex-5",
  clientId: "2",
  clientName: "Alex Morgan",
  sender: "Alex Morgan",
  message: "Should I track my steps too?",
  createdAt: "2026-11-02T11:00:00",
  senderType: "client",
  unreadFor: "coach",
},
{
  id: "alex-6",
  clientId: "2",
  clientName: "Alex Morgan",
  sender: "Coach Keys",
  message: "Yes, tracking your steps would be helpful.",
  createdAt: "2026-11-02T12:30:00",
  senderType: "coach",
},

// More Jordan Lee messages
{
  id: "jordan-3",
  clientId: "3",
  clientName: "Jordan Lee",
  sender: "Jordan Lee",
  message: "My legs are still sore from yesterday.",
  createdAt: "2026-11-02T08:00:00",
  senderType: "client",
  unreadFor: "coach",
},
{
  id: "jordan-4",
  clientId: "3",
  clientName: "Jordan Lee",
  sender: "Coach Keys",
  message: "Take a rest day and stretch gently.",
  createdAt: "2026-11-02T09:00:00",
  senderType: "coach",
},
{
  id: "jordan-5",
  clientId: "3",
  clientName: "Jordan Lee",
  sender: "Jordan Lee",
  message: "Should I still do my upper body workout?",
  createdAt: "2026-11-02T10:45:00",
  senderType: "client",
  unreadFor: "coach",
},
{
  id: "jordan-6",
  clientId: "3",
  clientName: "Jordan Lee",
  sender: "Coach Keys",
  message: "Yes, upper body training should be okay.",
  createdAt: "2026-11-02T11:30:00",
  senderType: "coach",
},
];

export function isUnreadFor(
  message: MockMessage,
  viewer: MessageViewer,
) {
  return message.unreadFor === viewer;
}

import mongoose, { Schema, Document } from 'mongoose';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp?: number;
  replyTo?: {
    id: string;
    content: string;
    role: string;
    agent?: string;
  };
}

interface IChatHistory extends Document {
  sessionId: string;
  messages: IMessage[];
  productName: string;
  perspective: 'developer' | 'management';
  lastReport: Record<string, unknown> | null;
  updatedAt: Date;
}

const ReplyRefSchema = new Schema({
  id:      String,
  content: String,
  role:    String,
  agent:   String,
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  agent:     { type: String },
  timestamp: { type: Number },
  replyTo:   { type: ReplyRefSchema, default: null },
});

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    sessionId:   { type: String, required: true, unique: true },
    messages:    [MessageSchema],
    productName: { type: String, default: '' },
    perspective: { type: String, enum: ['developer', 'management'], default: 'developer' },
    lastReport:  { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const ChatHistory =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMeta extends Document {
  sessionId: string;
  productName: string;
  founderName: string;
  context: string;
  ip: string;
  userAgent: string;
  worthinessScore: {
    overall: number;
    technical: number;
    market: number;
    security: number;
    sentiment: string;
    summary: string;
  } | null;
  promptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductMetaSchema = new Schema<IProductMeta>(
  {
    sessionId:    { type: String, required: true, unique: true },
    productName:  { type: String, default: '' },
    founderName:  { type: String, default: '' },
    context:      { type: String, default: '' },
    ip:           { type: String, default: '' },
    userAgent:    { type: String, default: '' },
    worthinessScore: {
      type: new Schema({
        overall:   Number,
        technical: Number,
        market:    Number,
        security:  Number,
        sentiment: String,
        summary:   String,
      }, { _id: false }),
      default: null,
    },
    promptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductMeta =
  mongoose.models.ProductMeta ||
  mongoose.model<IProductMeta>('ProductMeta', ProductMetaSchema);

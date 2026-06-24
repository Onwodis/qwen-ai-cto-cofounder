import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectSummary extends Document {
  sessionId: string;
  projectName: string;
  founderName: string;
  mode: string;
  roundCount: number;
  richSummary: string;
  entriesJson: string;
  openQuestionsJson: string;
  keyDecisionsJson: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSummarySchema = new Schema<IProjectSummary>(
  {
    sessionId:        { type: String, unique: true, required: true, index: true },
    projectName:      { type: String, default: '' },
    founderName:      { type: String, default: '' },
    mode:             { type: String, default: 'board' },
    roundCount:       { type: Number, default: 0 },
    richSummary:      { type: String, default: '' },
    entriesJson:      { type: String, default: '[]' },
    openQuestionsJson:{ type: String, default: '[]' },
    keyDecisionsJson: { type: String, default: '[]' },
    lastUpdated:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ProjectSummary =
  (mongoose.models.ProjectSummary as mongoose.Model<IProjectSummary>) ||
  mongoose.model<IProjectSummary>('ProjectSummary', ProjectSummarySchema);

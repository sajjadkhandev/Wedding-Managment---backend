import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const weddingTaskSchema = new Schema(
  {
    weddingProject: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingProject',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    },
    assignedTo: {
      type: String,
      trim: true,
      default: '' // e.g. "Groom's Brother", "Bride"
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

weddingTaskSchema.index({ weddingProject: 1, isCompleted: 1, priority: 1 });

export const WeddingTask = model('WeddingTask', weddingTaskSchema);
export default WeddingTask;

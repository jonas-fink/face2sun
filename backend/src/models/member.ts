import { Schema, model } from 'mongoose';

const memberSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export const Member = model('Member', memberSchema);

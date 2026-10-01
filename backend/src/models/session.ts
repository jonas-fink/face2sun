import { Schema, model, Types } from 'mongoose';

const sessionSchema = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
});

export const Session = model('Session', sessionSchema);

export type SessionMemberId = Types.ObjectId;

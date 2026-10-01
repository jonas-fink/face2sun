import { Schema, model } from 'mongoose';

const checkInSchema = new Schema({
    placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    expiresAt: { type: Date, required: true },
});

checkInSchema.index({ placeId: 1, memberId: 1 }, { unique: true });
checkInSchema.index({ placeId: 1, expiresAt: 1 });

export const CheckIn = model('CheckIn', checkInSchema);

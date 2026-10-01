import { Schema, model } from 'mongoose';

const momentSchema = new Schema({
    placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
});

momentSchema.index({ placeId: 1, createdAt: -1 });

export const Moment = model('Moment', momentSchema);

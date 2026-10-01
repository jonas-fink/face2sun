import { Schema, model } from 'mongoose';

const lightSchema = new Schema({
    placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true, unique: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, required: true },
});

export const Light = model('Light', lightSchema);

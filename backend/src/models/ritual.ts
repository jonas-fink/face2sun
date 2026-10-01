import { Schema, model } from 'mongoose';

const ritualSchema = new Schema({
    placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true, unique: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    title: { type: String, required: true },
    recurrence: { type: String, required: true },
    cap: { type: Number, required: true },
});

export const Ritual = model('Ritual', ritualSchema);

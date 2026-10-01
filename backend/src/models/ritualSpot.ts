import { Schema, model } from 'mongoose';

const ritualSpotSchema = new Schema({
    ritualId: { type: Schema.Types.ObjectId, ref: 'Ritual', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
});

ritualSpotSchema.index({ ritualId: 1, memberId: 1 }, { unique: true });

export const RitualSpot = model('RitualSpot', ritualSpotSchema);

import { Schema, model } from 'mongoose';

const photoSchema = new Schema(
    {
        filename: { type: String, required: true },
        contentType: { type: String, required: true },
    },
    { _id: false },
);

const placeSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        lightCue: {
            type: String,
            required: true,
            enum: ['early-light', 'morning-quiet', 'after-lunch', 'late-light'],
        },
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true },
        },
        photos: { type: [photoSchema], required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

placeSchema.index({ location: '2dsphere' });

export const Place = model('Place', placeSchema);

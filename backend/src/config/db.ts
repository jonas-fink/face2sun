import mongoose from 'mongoose';
import { env } from './env.ts';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGO_URI, { dbName: 'face2sun' });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('DB connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;

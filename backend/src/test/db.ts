import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer | undefined;

export async function connectTestDb(): Promise<void> {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
}

export async function clearTestDb(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
}

export async function disconnectTestDb(): Promise<void> {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    mongo = undefined;
}

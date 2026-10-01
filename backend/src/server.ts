import { connectDB, env } from '#config';
import app from './app.ts';

connectDB().then(() => {
    app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
});

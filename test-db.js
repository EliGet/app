const connectDB = require('./db');
connectDB().then(() => {
    console.log('Test successful!');
    process.exit(0);
});

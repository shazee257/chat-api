const express = require('express');
const http = require('http');
const cors = require('cors');
const API = require('./api');
const connectDB = require('./config/dbConnect');
const { io } = require('./socket');
const cookieSession = require('cookie-session');
const { notFound, errorHandler } = require('./middlewares/errorHandling');
const { log } = require('./middlewares/log');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();
const server = http.createServer(app);
io(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: [process.env.COOKIE_KEY],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));

app.use(cors({ origin: "*", credentials: false }));

app.get('/', (req, res) => res.json({ message: 'Welcome to the Divvi API' }));

app.use(log);
new API(app).registerGroups();
app.use(notFound);
app.use(errorHandler);

app.use("/", express.static("uploads"));
connectDB();

server.listen(PORT, () => console.log(`Server port ${PORT}`));


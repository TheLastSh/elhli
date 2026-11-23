import 'dotenv/config';
import WebServer from './bin/server.js';

const server = new WebServer();
server.listen();

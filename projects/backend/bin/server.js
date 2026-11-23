import express from 'express';
import http from 'http';
import os from 'os';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from '../databases/connection.js';
import healthRouter from '../api/health/health.routes.js';
import studentsRouter from '../api/students/student.routes.js';
import coursesRouter from '../api/courses/course.routes.js';
import gradesRouter from '../api/grades/grade.routes.js';
import attendanceRouter from '../api/attendance/attendance.routes.js';
import usersRouter from '../api/users/user.routes.js';
import reportsRouter from '../api/reports/reportcard.routes.js';
import { notFound, errorHandler } from '../middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WebServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: { origin: true, credentials: true },
      path: '/socket.io'
    });

    this.app.set('io', this.io);
    this.app.set('trust proxy', 1);

    this.database();
    this.middlewares();
    this.routes();
    this.publics();
    this.spaFallback();
    this.errorHandlers();
  }

  async database() {
    try {
      await connectDB();
    } catch (err) {
      console.error('[FATAL] No se pudo conectar a MongoDB:', err.message);
      if (process.env.NODE_ENV === 'production') process.exit(1);
    }
  }

  middlewares() {
    this.app.use(helmet({ contentSecurityPolicy: false }));
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : true,
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(fileUpload({ useTempFiles: true, tempFileDir: os.tmpdir(), createParentPath: true }));
  }

  routes() {
    this.app.use('/api/health', healthRouter);
    this.app.use('/api/students', studentsRouter);
    this.app.use('/api/courses', coursesRouter);
    this.app.use('/api/grades', gradesRouter);
    this.app.use('/api/attendance', attendanceRouter);
    this.app.use('/api/users', usersRouter);
    this.app.use('/api/reports', reportsRouter);
    // Registro dinámico de enrutadores del proyecto (Fase 2: students, courses, grades, attendance, auth, reports)
  }

  publics() {
    const publicPath = path.join(__dirname, '../public');
    this.app.use(express.static(publicPath));
  }

  spaFallback() {
    const publicPath = path.join(__dirname, '../public');
    this.app.get('/*path', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.resolve(publicPath, 'index.html'));
    });
  }

  errorHandlers() {
    // 404 y manejo global de errores (expandibles en Fase 2)
    this.app.use(notFound, errorHandler);
  }

  listen() {
    const port = process.env.PORT || 3500;
    this.server.listen(port, () => {
      const dbState = mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada';
      console.log(`Servidor ejecutándose en el puerto ${port}`);
      console.log(`MongoDB: ${dbState}`);
    });
  }
}

export default WebServer;

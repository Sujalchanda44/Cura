# HealthSync AI - Database Architecture

This directory houses the backend data persistence and memory repository layer for **HealthSync AI**.

## Zero-Dependency In-Memory Data Store

To allow instantaneous local development and testing without requiring a live MongoDB server or Docker setup, HealthSync AI includes a high-performance in-memory database store (`memoryStore.js`).

### Features:
- **Zero Configuration**: Starts up immediately with the Express server.
- **Pre-populated Seeds**: Loaded automatically upon server start with demo accounts (`admin@healthsync.ai`, `john@healthsync.ai`), health profiles, nutrition logs, metrics, and scheduled reminders.
- **Thread-safe CRUD operations**: Mirrors standard ORM/ODM query patterns (`find`, `findById`, `findOne`, `create`, `update`, `delete`, `count`).

---

## Future MongoDB / Mongoose Transition Guide

When you are ready to connect to a production MongoDB cluster or Atlas database:

1. Install Mongoose:
   ```bash
   npm install mongoose
   ```

2. Add your MongoDB URI to `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/healthsync_ai
   ```

3. Models in `server/models/` are pre-structured to map 1:1 with Mongoose Schemas.

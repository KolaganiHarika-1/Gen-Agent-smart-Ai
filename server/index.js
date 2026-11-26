import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { readDb, writeDb, addLog } from './store.js';
import { createDecision } from './decisionEngine.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'GenAgent API', time: new Date().toISOString() });
});

app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const db = await readDb();
    const total = db.tasks.length;
    const completed = db.tasks.filter(t => t.status === 'Completed').length;
    const pending = db.tasks.filter(t => t.status === 'Pending').length;
    const inProgress = db.tasks.filter(t => t.status === 'In Progress').length;
    res.json({
      stats: { total, completed, pending, inProgress, completionRate: total ? Math.round(completed / total * 100) : 0 },
      tasks: db.tasks,
      decisions: db.decisions.slice(0, 5),
      logs: db.logs.slice(0, 8)
    });
  } catch (error) { next(error); }
});

app.get('/api/tasks', async (_req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.tasks);
  } catch (error) { next(error); }
});

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '', priority = 'Medium', category = 'General' } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Task title is required.' });
    if (!['Low', 'Medium', 'High'].includes(priority)) return res.status(400).json({ error: 'Invalid priority.' });
    const db = await readDb();
    const now = new Date().toISOString();
    const task = {
      id: randomUUID(), title: String(title).trim(), description: String(description).trim(),
      priority, category: String(category).trim() || 'General', status: 'Pending',
      createdAt: now, updatedAt: now
    };
    db.tasks.unshift(task);
    await writeDb(db);
    await addLog('task-created', `Created task: ${task.title}`, { taskId: task.id });
    res.status(201).json(task);
  } catch (error) { next(error); }
});

app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'priority', 'status', 'category'];
    const db = await readDb();
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) task[key] = req.body[key];
    }
    if (!['Pending', 'In Progress', 'Completed'].includes(task.status)) return res.status(400).json({ error: 'Invalid status.' });
    if (!['Low', 'Medium', 'High'].includes(task.priority)) return res.status(400).json({ error: 'Invalid priority.' });
    task.updatedAt = new Date().toISOString();
    await writeDb(db);
    await addLog('task-updated', `Updated task: ${task.title}`, { taskId: task.id, status: task.status });
    res.json(task);
  } catch (error) { next(error); }
});

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const index = db.tasks.findIndex(t => t.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Task not found.' });
    const [removed] = db.tasks.splice(index, 1);
    await writeDb(db);
    await addLog('task-deleted', `Deleted task: ${removed.title}`, { taskId: removed.id });
    res.json({ ok: true, deletedId: removed.id });
  } catch (error) { next(error); }
});

app.post('/api/decisions', async (req, res, next) => {
  try {
    const result = createDecision(req.body?.problem);
    const db = await readDb();
    const decision = { id: randomUUID(), problem: String(req.body.problem).trim(), ...result, createdAt: new Date().toISOString() };
    db.decisions.unshift(decision);
    db.decisions = db.decisions.slice(0, 100);
    await writeDb(db);
    await addLog('decision-created', 'Generated a decision recommendation.', { decisionId: decision.id, priority: decision.priority });
    res.status(201).json(decision);
  } catch (error) { next(error); }
});

app.get('/api/logs', async (_req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.logs);
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`GenAgent API running at http://localhost:${PORT}`);
});

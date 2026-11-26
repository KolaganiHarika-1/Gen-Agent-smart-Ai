import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, BrainCircuit, CheckCircle2, CircleAlert, Clock3, LayoutDashboard,
  ListTodo, Plus, RefreshCw, Search, Send, Sparkles, Trash2, Zap, Menu, X,
  ArrowUpRight, Target, History, ChevronDown
} from 'lucide-react';

const API = '/api';
const initialForm = { title: '', description: '', priority: 'Medium', category: 'General' };

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function App() {
  const [page, setPage] = useState('Overview');
  const [dashboard, setDashboard] = useState({ stats: {}, tasks: [], decisions: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [problem, setProblem] = useState('');
  const [decision, setDecision] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  async function loadDashboard() {
    try {
      setError('');
      const data = await request('/dashboard');
      setDashboard(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadDashboard(); }, []);

  const filteredTasks = useMemo(() => dashboard.tasks.filter(task =>
    `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(query.toLowerCase())
  ), [dashboard.tasks, query]);

  async function createTask(event) {
    event.preventDefault();
    try {
      await request('/tasks', { method: 'POST', body: JSON.stringify(form) });
      setForm(initialForm); setShowForm(false); setNotice('Task created successfully.');
      await loadDashboard();
    } catch (e) { setError(e.message); }
  }

  async function updateTask(task, status) {
    try {
      await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`Task moved to ${status}.`); await loadDashboard();
    } catch (e) { setError(e.message); }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await request(`/tasks/${task.id}`, { method: 'DELETE' });
      setNotice('Task deleted.'); await loadDashboard();
    } catch (e) { setError(e.message); }
  }

  async function generateDecision(event) {
    event.preventDefault();
    if (!problem.trim()) return;
    setThinking(true); setDecision(null);
    try {
      const result = await request('/decisions', { method: 'POST', body: JSON.stringify({ problem }) });
      setDecision(result); setNotice('Decision recommendation generated.'); await loadDashboard();
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  }

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Tasks', icon: ListTodo },
    { name: 'AI Assistant', icon: BrainCircuit },
    { name: 'Activity', icon: History }
  ];
  const stats = dashboard.stats || {};

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Bot size={23}/></div><div><strong>GenAgent</strong><span>SMART AI WORKSPACE</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} onClick={() => { setPage(item.name); setMobileNav(false); }}><item.icon size={18}/><span>{item.name}</span>{item.name === 'Tasks' && <small>{stats.total || 0}</small>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="online-dot"></div><div><b>Local workspace</b><span>Backend connection enabled</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="menu-btn" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><span className="api-status"><i></i> API connected</span><button className="icon-btn" title="Refresh" onClick={loadDashboard}><RefreshCw size={17}/></button><div className="avatar">GA</div></div></header>
        <div className="content">
          {error && <div className="alert error"><CircleAlert size={17}/>{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
          {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice('')}><X size={16}/></button></div>}

          {page === 'Overview' && <Overview stats={stats} tasks={dashboard.tasks} logs={dashboard.logs} onNavigate={setPage} loading={loading} />}
          {page === 'Tasks' && <section>
            <div className="page-heading"><div><div className="eyebrow">EXECUTION CENTER</div><h1>Task management</h1><p>Create tasks, track progress, and manage priorities.</p></div><button className="primary-btn" onClick={() => setShowForm(v => !v)}><Plus size={17}/> New task</button></div>
            {showForm && <form className="panel task-form" onSubmit={createTask}><div className="panel-title"><h3>Create a task</h3><button type="button" className="icon-btn" onClick={() => setShowForm(false)}><X size={17}/></button></div><div className="form-grid"><label>Task title<input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Prepare weekly report"/></label><label>Category<input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="Work, Personal, Project..."/></label><label>Priority<select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="wide">Description<textarea rows="2" value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Add task details..."/></label></div><div className="form-footer"><button className="primary-btn" type="submit"><Plus size={16}/> Create task</button></div></form>}
            <div className="panel"><div className="panel-title task-toolbar"><div><h3>All tasks <span className="count">{filteredTasks.length}</span></h3><p>Manage your current workload</p></div><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks"/></div></div><TaskTable tasks={filteredTasks} onUpdate={updateTask} onDelete={deleteTask}/></div>
          </section>}
          {page === 'AI Assistant' && <section>
            <div className="page-heading"><div><div className="eyebrow">INTELLIGENCE STUDIO</div><h1>AI decision assistant</h1><p>Describe a situation to receive a structured recommendation.</p></div><div className="ai-chip"><Sparkles size={15}/> Local decision engine</div></div>
            <div className="assistant-layout"><div className="panel assistant-panel"><div className="assistant-icon"><BrainCircuit size={25}/></div><h2>What decision are you working on?</h2><p>Share the situation, goal, and any deadline or constraints. GenAgent will assess priority and suggest next steps.</p><form onSubmit={generateDecision}><label className="sr-only" htmlFor="problem">Describe your situation</label><textarea id="problem" rows="6" value={problem} onChange={e => setProblem(e.target.value)} placeholder="Example: I have a project review tomorrow and need to prioritize the remaining tasks..."/><div className="assistant-footer"><span>{problem.length} characters</span><button className="primary-btn" disabled={thinking || problem.trim().length < 8}>{thinking ? <><RefreshCw className="spin" size={16}/> Analyzing</> : <>Generate recommendation <Send size={16}/></>}</button></div></form></div>
              <div className="panel tips-panel"><div className="eyebrow">HOW IT WORKS</div><h3>From uncertainty to action</h3>{[['01','Understand','Your situation is checked for urgency and key context.'],['02','Prioritize','A suggested priority and rationale are generated.'],['03','Act','Follow a practical sequence of next steps.']].map(x => <div className="tip-row" key={x[0]}><b>{x[0]}</b><div><strong>{x[1]}</strong><span>{x[2]}</span></div></div>)}<div className="notice-box"><CircleAlert size={16}/> Recommendations are rule-based and should be reviewed before important decisions.</div></div></div>
            {decision && <div className="panel decision-result"><div className="result-head"><div><div className="eyebrow">RECOMMENDATION GENERATED</div><h2>Your action plan</h2></div><span className={`priority ${decision.priority.toLowerCase()}`}>{decision.priority} priority</span></div><p className="decision-summary">{decision.summary}</p><p className="muted">{decision.rationale}</p><h3>Recommended next steps</h3><ol className="steps">{decision.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><h3>Things to consider</h3><ul className="risk-list">{decision.risks.map((risk,i)=><li key={i}>{risk}</li>)}</ul><small className="muted">Generated by {decision.generatedBy}</small></div>}
          </section>}
          {page === 'Activity' && <section><div className="page-heading"><div><div className="eyebrow">AUDIT TRAIL</div><h1>Activity history</h1><p>Recent task and decision events stored by the backend.</p></div></div><div className="panel"><div className="panel-title"><h3>Recent activity</h3><span className="count">{dashboard.logs.length}</span></div><ActivityList logs={dashboard.logs}/></div></section>}
        </div>
      </main>
    </div>
  );
}

function Overview({stats, tasks, logs, onNavigate, loading}) {
  const cards = [
    {label:'Total tasks',value:stats.total ?? 0,sub:'All created tasks',icon:ListTodo,tone:'blue'},
    {label:'Completed',value:stats.completed ?? 0,sub:'Successfully finished',icon:CheckCircle2,tone:'green'},
    {label:'In progress',value:stats.inProgress ?? 0,sub:'Currently being worked on',icon:Activity,tone:'purple'},
    {label:'Pending',value:stats.pending ?? 0,sub:'Waiting to be started',icon:Clock3,tone:'orange'}
  ];
  return <section><div className="page-heading"><div><div className="eyebrow">MONDAY, NOVEMBER 2026</div><h1>Good to see you, Agent.</h1><p>Here’s your decision and execution overview.</p></div><button className="secondary-btn" onClick={() => onNavigate('AI Assistant')}><Sparkles size={16}/> Ask GenAgent</button></div>
    <div className="stats-grid">{cards.map(c=><div className="stat-card" key={c.label}><div className={`stat-icon ${c.tone}`}><c.icon size={19}/></div><div className="stat-label">{c.label}</div><div className="stat-value">{loading?'—':c.value}</div><div className="stat-sub">{c.sub}</div></div>)}</div>
    <div className="overview-grid"><div className="panel"><div className="panel-title"><div><h3>Priority tasks</h3><p>Your latest tasks and their status</p></div><button className="text-btn" onClick={() => onNavigate('Tasks')}>View all <ArrowUpRight size={15}/></button></div><TaskTable tasks={tasks.slice(0,5)} compact onUpdate={()=>onNavigate('Tasks')} onDelete={()=>onNavigate('Tasks')}/></div>
      <div className="panel progress-panel"><div className="panel-title"><div><h3>Execution progress</h3><p>Overall completion rate</p></div><Target size={18} className="muted-icon"/></div><div className="progress-number">{stats.completionRate ?? 0}<small>%</small></div><div className="progress-track"><div style={{width:`${stats.completionRate ?? 0}%`}}/></div><div className="progress-meta"><span>Completed tasks</span><b>{stats.completed ?? 0} / {stats.total ?? 0}</b></div><div className="mini-callout"><Zap size={16}/><span>Keep momentum by completing your highest-priority task first.</span></div></div></div>
    <div className="panel activity-preview"><div className="panel-title"><div><h3>Recent activity</h3><p>Latest workspace events</p></div><button className="text-btn" onClick={() => onNavigate('Activity')}>Activity log <ArrowUpRight size={15}/></button></div><ActivityList logs={logs.slice(0,4)}/></div>
  </section>;
}

function TaskTable({tasks, onUpdate, onDelete, compact=false}) {
  if (!tasks.length) return <div className="empty-state"><ListTodo size={27}/><b>No tasks found</b><span>Create a task to start organizing your work.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>TASK</th><th>PRIORITY</th><th>STATUS</th>{!compact && <th>UPDATE</th>}<th></th></tr></thead><tbody>{tasks.map(task=><tr key={task.id}><td><div className="task-name">{task.title}</div><div className="task-desc">{task.category} {task.description ? `· ${task.description}` : ''}</div></td><td><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></td><td><span className={`status ${task.status.toLowerCase().replace(' ','-')}`}><i/>{task.status}</span></td>{!compact && <td><select className="status-select" value={task.status} onChange={e=>onUpdate(task,e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select></td>}<td>{!compact && <button className="delete-btn" title="Delete task" onClick={()=>onDelete(task)}><Trash2 size={15}/></button>}</td></tr>)}</tbody></table></div>;
}

function ActivityList({logs}) {
  if (!logs?.length) return <div className="empty-state small-empty">No activity yet. Your actions will appear here.</div>;
  return <div className="activity-list">{logs.map(log=><div className="activity-row" key={log.id}><div className={`activity-dot ${log.type.includes('decision')?'purple':''}`}><Activity size={14}/></div><div className="activity-message"><b>{log.message}</b><span>{new Date(log.createdAt).toLocaleString()}</span></div><ChevronDown size={15} className="muted-icon"/></div>)}</div>;
}

export default App;

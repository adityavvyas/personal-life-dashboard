'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';

import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import { useToast } from '@/context/ToastProvider';

export default function TodosPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [todos, setTodos] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });
  
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('due_date'); // due_date, priority, date_created

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*');
    if (data) setTodos(data);
  };

  const handleAddTodo = async () => {
    if (!newTodo.title || !newTodo.due_date) {
      if (addToast) addToast(t('todos.errorTitle') || 'Please enter title and due date', 'error');
      return;
    }
    
    const { error } = await supabase.from('todos').insert([{
      title: newTodo.title,
      priority: newTodo.priority,
      due_date: newTodo.due_date,
      completed: false,
      date_created: new Date().toISOString().split('T')[0]
    }]);

    if (error) {
      console.error(error);
      if (addToast) addToast(t('todos.errorAdd') || 'Failed to add task', 'error');
    } else {
      setIsAdding(false);
      setNewTodo({ title: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });
      fetchTodos();
      if (addToast) addToast(t('todos.successAdd') || 'Task added successfully', 'success');
    }
  };

  const handleToggleComplete = async (todo) => {
    const { error } = await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id);
    if (!error) {
      fetchTodos();
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm(t('todos.confirmDelete') || 'Are you sure you want to delete this task?')) {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (!error) {
        fetchTodos();
        if (addToast) addToast(t('todos.successDelete') || 'Task deleted', 'success');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const totalTasks = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = totalTasks - completedCount;
  const dueTodayCount = todos.filter(t => !t.completed && t.due_date === todayStr).length;

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  let filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  filteredTodos.sort((a, b) => {
    if (sortBy === 'due_date') {
      const dateA = new Date(a.due_date || '2099-12-31').getTime();
      const dateB = new Date(b.due_date || '2099-12-31').getTime();
      if (dateA !== dateB) return dateA - dateB;
      return b.id.localeCompare(a.id);
    }
    if (sortBy === 'priority') {
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (diff !== 0) return diff;
      return new Date(a.due_date || '2099-12-31').getTime() - new Date(b.due_date || '2099-12-31').getTime();
    }
    if (sortBy === 'date_created') {
      const dateA = new Date(a.date_created || a.created_at || 0).getTime();
      const dateB = new Date(b.date_created || b.created_at || 0).getTime();
      return dateB - dateA;
    }
    return 0;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('todos.title') || 'Tasks & To-Dos'}</h1>
          <p className="page-subtitle">{t('todos.subtitle') || 'Organize your day and get things done.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className={isAdding ? "btn-secondary" : "btn-primary"}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            {isAdding ? (t('common.cancel') || 'Cancel') : <><Plus size={14} /> {t('todos.addTask') || 'Add Task'}</>}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid-cards" 
        style={{ marginBottom: '3rem' }}
      >
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('todos.totalTasks') || 'Total Tasks'}</span>
          </div>
          <div className="stat-card-value">{totalTasks}</div>
          <div className="stat-card-footer">{t('todos.trackedOverall') || 'tasks tracked'}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('todos.completed') || 'Completed'}</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--accent-success)' }}>{completedCount}</div>
          <div className="stat-card-footer">{t('todos.tasksCompleted') || 'tasks done'}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('todos.pending') || 'Pending'}</span>
          </div>
          <div className="stat-card-value" style={{ color: pendingCount > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>{pendingCount}</div>
          <div className="stat-card-footer">{t('todos.tasksPending') || 'tasks remaining'}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('todos.dueToday') || 'Due Today'}</span>
          </div>
          <div className="stat-card-value" style={{ color: dueTodayCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{dueTodayCount}</div>
          <div className="stat-card-footer">{t('todos.actionNeeded') || 'action needed'}</div>
        </motion.div>
      </motion.div>

      {isAdding && (
        <motion.div variants={itemVariants} className="soft-panel" style={{ padding: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-strong)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('todos.newTask') || 'New Task'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder={t('todos.taskTitle') || "Task title..."} 
              value={newTodo.title} 
              onChange={e => setNewTodo({...newTodo, title: e.target.value})} 
              required 
            />
            <CustomDatePicker 
              value={newTodo.due_date} 
              onChange={val => setNewTodo({...newTodo, due_date: val})} 
            />
            <CustomSelect 
              options={[
                { value: 'high', label: t('todos.priority.high') || 'High Priority' },
                { value: 'medium', label: t('todos.priority.medium') || 'Medium Priority' },
                { value: 'low', label: t('todos.priority.low') || 'Low Priority' }
              ]}
              value={newTodo.priority}
              onChange={(val) => setNewTodo({...newTodo, priority: val})}
            />
          </div>
          <button className="btn-primary" onClick={handleAddTodo} style={{ alignSelf: 'flex-start' }}>{t('todos.saveTask') || 'Save Task'}</button>
        </motion.div>
      )}

      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{t('todos.allTasks') || 'All Tasks'}</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {['all', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: filter === f ? 'var(--bg-body)' : 'transparent',
                    color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {t(`todos.filter.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('todos.sortBy') || 'Sort by:'}</span>
              <div style={{ width: '150px' }}>
                <CustomSelect
                  options={[
                    { value: 'due_date', label: t('todos.sort.dueDate') || 'Due Date' },
                    { value: 'priority', label: t('todos.sort.priority') || 'Priority' },
                    { value: 'date_created', label: t('todos.sort.dateCreated') || 'Date Created' }
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="list-group"
        >
          {filteredTodos.length === 0 && !isAdding && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('todos.noTasks') || 'No tasks found. Click "Add Task" to create one.'}
            </div>
          )}
          {filteredTodos.map((todo) => {
            let priorityColor = 'var(--text-muted)';
            if (todo.priority === 'high') priorityColor = 'var(--accent-danger)';
            if (todo.priority === 'medium') priorityColor = 'var(--accent-warning)';
            if (todo.priority === 'low') priorityColor = 'var(--accent-success)';

            return (
              <motion.div key={todo.id} variants={itemVariants} className="list-item" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: todo.completed ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleComplete(todo)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.completed ? 'var(--accent-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </motion.button>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)', textDecoration: todo.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {todo.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: priorityColor, fontWeight: 600 }}>
                        <Flag size={12} />
                        {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                      </span>
                      {todo.due_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          {new Date(todo.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <button onClick={() => handleDeleteTodo(todo.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  );
}

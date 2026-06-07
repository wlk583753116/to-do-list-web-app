import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Sparkles, Edit2, X, Clock } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
type UrgencyCategory = 'urgent' | 'normal' | 'relaxed';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  createdAt: number;
}

interface CategorizedTodos {
  urgent: Todo[];
  normal: Todo[];
  relaxed: Todo[];
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const stored = localStorage.getItem('todos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [showClearAll, setShowClearAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        createdAt: Date.now()
      },
      ...prev,
    ]);
    setInput('');
    setDueDate('');
    setDueTime('');
    setPriority('medium');
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate || '');
    setEditDueTime(todo.dueTime || '');
  };

  const saveEdit = () => {
    if (!editText.trim() || !editingId) return;
    setTodos(prev =>
      prev.map(t => (t.id === editingId ? {
        ...t,
        text: editText,
        priority: editPriority,
        dueDate: editDueDate || undefined,
        dueTime: editDueTime || undefined,
      } : t))
    );
    setEditingId(null);
    setEditText('');
    setEditPriority('medium');
    setEditDueDate('');
    setEditDueTime('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority('medium');
    setEditDueDate('');
    setEditDueTime('');
  };

  const clearAll = () => {
    setTodos([]);
    setShowClearAll(false);
  };

  const getTimeRemaining = (dueDate?: string, dueTime?: string): { text: string; category: UrgencyCategory } | null => {
    if (!dueDate) return null;

    const now = new Date();
    const dueDateTime = new Date(`${dueDate}T${dueTime || '23:59'}`);
    const diff = dueDateTime.getTime() - now.getTime();

    if (diff < 0) {
      return { text: '已截止', category: 'urgent' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeText = '';
    if (days > 0) {
      timeText = `还有 ${days} 天`;
    } else if (hours > 0) {
      timeText = `还有 ${hours} 小时`;
    } else {
      timeText = `还有 ${minutes} 分钟`;
    }

    let category: UrgencyCategory;
    if (days < 1) {
      category = 'urgent';
    } else if (days < 3) {
      category = 'normal';
    } else {
      category = 'relaxed';
    }

    return { text: timeText, category };
  };

  const getUrgencyLabel = (category: UrgencyCategory): string => {
    const labels = {
      urgent: '时限迫近',
      normal: '周期适中',
      relaxed: '余量充裕',
    };
    return labels[category];
  };

  const getUrgencyColor = (category: UrgencyCategory): string => {
    const colors = {
      urgent: 'from-red-50 to-red-100 border-red-200',
      normal: 'from-yellow-50 to-yellow-100 border-yellow-200',
      relaxed: 'from-green-50 to-green-100 border-green-200',
    };
    return colors[category];
  };

  const getUrgencyBadgeColor = (category: UrgencyCategory): string => {
    const colors = {
      urgent: 'bg-red-500',
      normal: 'bg-yellow-500',
      relaxed: 'bg-green-500',
    };
    return colors[category];
  };

  const getPriorityOrder = (p: Priority): number => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[p];
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'border-red-200';
      case 'medium':
        return 'border-yellow-200';
      case 'low':
        return 'border-green-200';
    }
  };

  const getPriorityBadge = (p: Priority) => {
    const badges: Record<Priority, { label: string; color: string }> = {
      high: { label: '高', color: 'bg-red-500' },
      medium: { label: '中', color: 'bg-yellow-500' },
      low: { label: '低', color: 'bg-green-500' },
    };
    const badge = badges[p];
    return (
      <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
        {badge.label}
      </span>
    );
  };

  const incompleteTodos = todos.filter(t => !t.completed);

  const categorizedTodos: CategorizedTodos = {
    urgent: [],
    normal: [],
    relaxed: [],
  };

  incompleteTodos.forEach(todo => {
    const timeInfo = getTimeRemaining(todo.dueDate, todo.dueTime);
    const category = timeInfo?.category || 'relaxed';
    categorizedTodos[category].push(todo);
  });

  // Sort each category by priority
  Object.keys(categorizedTodos).forEach((key) => {
    categorizedTodos[key as UrgencyCategory].sort(
      (a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
    );
  });

  const completedTodos = todos.filter(t => t.completed);
  const completedCount = completedTodos.length;

  const renderTodoItem = (todo: Todo) => {
    if (editingId === todo.id) {
      return (
        <div key={todo.id} className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-blue-50 space-y-3">
          <input
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && cancelEdit()}
            autoFocus
            placeholder="任务名称"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">截止日期</label>
              <input
                type="date"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">截止时间</label>
              <input
                type="time"
                value={editDueTime}
                onChange={e => setEditDueTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">优先级:</span>
            <button
              onClick={() => setEditPriority('high')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                editPriority === 'high'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              高
            </button>
            <button
              onClick={() => setEditPriority('medium')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                editPriority === 'medium'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              中
            </button>
            <button
              onClick={() => setEditPriority('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                editPriority === 'low'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              低
            </button>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      );
    }

    const timeInfo = getTimeRemaining(todo.dueDate, todo.dueTime);
    const urgencyCategory = timeInfo?.category || 'relaxed';

    return (
      <div
        key={todo.id}
        className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm border transition-all bg-gradient-to-r ${getUrgencyColor(urgencyCategory)} hover:shadow-md`}
      >
        <button
          onClick={() => toggleTodo(todo.id)}
          className="flex-shrink-0 transition-transform active:scale-90"
        >
          {todo.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span
            className={`block text-sm leading-relaxed transition-all ${
              todo.completed
                ? 'line-through text-gray-500'
                : 'text-gray-700 font-medium'
            }`}
          >
            {todo.text}
          </span>
          {timeInfo && !todo.completed && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className={`text-xs font-medium ${
                urgencyCategory === 'urgent' ? 'text-red-600' :
                urgencyCategory === 'normal' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {timeInfo.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {timeInfo && (
            <span className={`${getUrgencyBadgeColor(urgencyCategory)} text-white text-xs px-2 py-1 rounded-full font-medium`}>
              {getUrgencyLabel(urgencyCategory)}
            </span>
          )}
          {getPriorityBadge(todo.priority)}
        </div>

        <button
          onClick={() => startEdit(todo)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => deleteTodo(todo.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-purple-100 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl shadow-lg shadow-purple-200 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">我的待办清单 ✨</h1>
          <p className="text-gray-500 text-sm mt-1">记录你的每一个想法与目标</p>
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-blue-50 text-center">
              <div className="text-2xl font-bold text-blue-500">{incompleteTodos.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">待完成</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-blue-50 text-center">
              <div className="text-2xl font-bold text-emerald-500">{completedCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">已完成</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-sm border border-blue-50 text-center">
              <div className="text-2xl font-bold text-gray-600">{todos.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">全部</div>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-3 mb-5 bg-white rounded-2xl p-4 shadow-sm border border-blue-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="今天要做什么？"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="flex items-center justify-center px-3 h-10 bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 disabled:from-blue-200 disabled:to-purple-200 disabled:cursor-not-allowed rounded-xl shadow-md shadow-purple-200 text-white font-medium text-sm transition-all active:scale-95"
            >
              ➕ 添加
            </button>
          </div>

          {/* Date and Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">截止时间</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">优先级:</span>
            <button
              onClick={() => setPriority('high')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                priority === 'high'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              高
            </button>
            <button
              onClick={() => setPriority('medium')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                priority === 'medium'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              中
            </button>
            <button
              onClick={() => setPriority('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                priority === 'low'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              低
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-6">
          {incompleteTodos.length === 0 && todos.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-sm font-medium mb-2">还没有任务呢</p>
              <p className="text-xs text-gray-300">快来添加第一个任务，开启高效的一天吧！</p>
            </div>
          )}

          {/* Urgent section */}
          {categorizedTodos.urgent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-red-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-red-600">时限迫近</h2>
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">{categorizedTodos.urgent.length}</span>
              </div>
              <div className="space-y-2">
                {categorizedTodos.urgent.map(renderTodoItem)}
              </div>
            </div>
          )}

          {/* Normal section */}
          {categorizedTodos.normal.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-yellow-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-yellow-600">周期适中</h2>
                <span className="text-xs text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">{categorizedTodos.normal.length}</span>
              </div>
              <div className="space-y-2">
                {categorizedTodos.normal.map(renderTodoItem)}
              </div>
            </div>
          )}

          {/* Relaxed section */}
          {categorizedTodos.relaxed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-green-600">余量充裕</h2>
                <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full">{categorizedTodos.relaxed.length}</span>
              </div>
              <div className="space-y-2">
                {categorizedTodos.relaxed.map(renderTodoItem)}
              </div>
            </div>
          )}

          {/* Completed section */}
          {completedTodos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-emerald-600">已完成</h2>
                <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">{completedTodos.length}</span>
              </div>
              <div className="space-y-2">
                {completedTodos.map(renderTodoItem)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {todos.length > 0 && (
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            {completedCount > 0 && (
              <button
                onClick={() => setTodos(prev => prev.filter(t => !t.completed))}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 transition-all px-4 py-2 rounded-xl shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                清空已完成
              </button>
            )}

            <button
              onClick={() => setShowClearAll(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all px-4 py-2 rounded-xl shadow-sm active:scale-95"
            >
              <X className="w-4 h-4" />
              全部清空
            </button>
          </div>
        )}

        {/* Clear all confirmation modal */}
        {showClearAll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-2">确认清空所有任务？</h2>
              <p className="text-sm text-gray-500 mb-6">此操作无法撤销，所有任务都会被删除。</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearAll(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

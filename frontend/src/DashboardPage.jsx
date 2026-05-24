import React, {useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid} from 'recharts';
import {BrainCircuit, TrendingUp, Wallet, Lightbulb, ArrowUpRight, ArrowDownLeft, Landmark, FileText} from 'lucide-react';
import './DashboardPage.css';

const API_URL = import.meta.env.PROD 
  ? 'https://smartbudget-ai-production-d837.up.railway.app' 
  : '';

const COLORS = ['#5395ff', '#04d972', '#f59e0b', '#ef4444', '#85009c', '#ffe600', '#bbff00', '#f30069'];

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const uploadedFile = location.state?.uploadedFile;

  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uploadedFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { uploadedFile } });
      return;
    }

    const analyzeFile = async () => {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('statement', uploadedFile);

      try {
        const response = await fetch(`${API_URL}/api/upload`, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const jsonResponse = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            throw new Error(jsonResponse.message || jsonResponse.error || 'Сессия истекла. Войдите снова.');
          }
          throw new Error(jsonResponse.message || 'Не удалось проанализировать файл. Попробуйте еще раз.');
        }

        const data = jsonResponse.data;

        setStats({
          bank: data.bank || "Неизвестно",
          fileType: data.file_type || "?",
          totalExpenses: data.total_expenses || 0,
          totalIncome: data.total_income || 0,
          count: data.transactions_count || 0,
          summary: data.summary || "ИИ не смог сформировать вывод.",
          mainProblem: data.main_problem || "Нет данных.",
          positive: data.positive || "Нет данных."
        });

        const transformedCategories = data.categories
          ? Object.entries(data.categories).map(([name, details]) => ({
              name: name,
              value: details.total
            }))
          : [];
        setCategoryData(transformedCategories);

        setComparisonData([
          { name: 'Доходы', Сумма: data.total_income || 0 },
          { name: 'Расходы', Сумма: data.total_expenses || 0 }
        ]);

        setAiInsights(Array.isArray(data.tips) ? data.tips : []);

      } catch (err) {
        console.error("Поймана ошибка:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeFile();
  }, [uploadedFile, navigate]);

  if (isLoading) {
    return (
      <div className="dashboard-centered-page">
        <div className="status-card">
          <div className="icon-pulse-wrapper">
            <BrainCircuit size={50} color="#6366f1" className="loading-icon-pulse" />
          </div>
          <h2 className="gradient-text">SmartBudget AI думает...</h2>
          <p className="status-text">Искусственный интеллект распределяет транзакции по категориям и ищет инсайты.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-centered-page">
        <div className="status-card error-card">
          <h2 className="error-title">Произошла ошибка</h2>
          <p className="status-text">{error}</p>
          <button className="action-button" onClick={() => navigate('/')}>Вернуться на главную</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-centered-page">
        <div className="status-card">
          <h2>Нет данных</h2>
          <p className="status-text">Пожалуйста, загрузите банковскую выписку для начала анализа.</p>
          <button className="action-button" onClick={() => navigate('/')}>Загрузить файл</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Аналитика расходов</h1>
          <p className="dashboard-subtitle">Анализ выписки из банка <strong>{stats.bank}</strong> ({stats.fileType.toUpperCase()})</p>
        </div>
        <div className="transaction-count-badge">
          <FileText size={20} color="#64748b" />
          <span>Обработано транзакций: <strong>{stats.count}</strong></span>
        </div>
      </div>

      <div className="stats-cards-grid">
        <div className="stat-card income">
          <div className="stat-icon-wrapper income"><ArrowUpRight size={24} /></div>
          <div>
            <p className="stat-label income">Всего доходов</p>
            <h3>{stats.totalIncome.toLocaleString()} сом</h3>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon-wrapper expense"><ArrowDownLeft size={24} /></div>
          <div>
            <p className="stat-label expense">Всего расходов</p>
            <h3>{stats.totalExpenses.toLocaleString()} сом</h3>
          </div>
        </div>

        <div className="stat-card balance">
          <div className="stat-icon-wrapper balance"><Wallet size={24} /></div>
          <div>
            <p className="stat-label balance">Чистый баланс</p>
            <h3>{(stats.totalIncome - stats.totalExpenses).toLocaleString()} сом</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-title">Расходы по категориям</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius="40%" outerRadius="75%" paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} сом`} />
                <Legend verticalAlign="bottom" height={70}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Соотношение бюджета</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `${value.toLocaleString()} сом`} />
                <Bar dataKey="Сумма" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={50}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="ai-tips-section">
        <h2 className="ai-section-title">
          <BrainCircuit color="#6366f1" size={28} /> Наблюдения и Советы от SmartBudget AI
        </h2>

        <div className="ai-summary-card">
          <h4 className="ai-summary-title">Анализ финансового поведения:</h4>
          <p className="ai-summary-text">{stats.summary}</p>
        </div>

        <div className="ai-problems-grid">
          <div className="ai-problem-card warning">
            <h4 className="ai-problem-title warning"><TrendingUp size={18} /> Главная уязвимость:</h4>
            <p className="ai-problem-text warning-text">{stats.mainProblem}</p>
          </div>
          <div className="ai-problem-card success">
            <h4 className="ai-problem-title success"><Landmark size={18} /> Сильная сторона:</h4>
            <p className="ai-problem-text success-text">{stats.positive}</p>
          </div>
        </div>

        <div className="ai-tips-grid">
          {aiInsights.map((text, index) => (
            <div key={index} className="tip-card">
              <div className="tip-icon-wrapper"><Lightbulb size={24} /></div>
              <div className="tip-content">
                <h3>Рекомендация №{index + 1}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
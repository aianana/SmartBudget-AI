import React, {useState, useEffect} from 'react';
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid} from 'recharts';
import {BrainCircuit, TrendingUp, Wallet, Lightbulb} from 'lucide-react';
import './DashboardPage.css';

const categoryData = [ //временные данные
  {name: 'Еда и продукты', value: 15000 },
  {name: 'Жилье', value: 25000},
  {name: 'Транспорт', value: 5000},
  {name: 'Развлечения', value: 8000},
  {name: 'Подписки', value: 2000},
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const monthlyData = [ //временные данные
  {name: 'Янв', Расходы: 45000},
  {name: 'Фев', Расходы: 52000},
  {name: 'Март', Расходы: 48000},
  {name: 'Апр', Расходы: 61000},
  {name: 'Май', Расходы: 55000},
];

const aiTips = [
  { id: 1, title: 'Оптимизация подписок', text: 'Мы заметили, что вы платите за 3 стриминговых сервиса. Отказ от одного сэкономит вам 800 сом в месяц.', icon: <Wallet size={24} />},
  { id: 2, title: 'Аномалия в категории "Еда"', text: 'В этом месяце траты на рестораны выросли на 30%. Рекомендуем готовить дома чаще на следующей неделе.', icon: <TrendingUp size={24} />},
  { id: 3, title: 'Умный резерв', text: 'Ваш средний остаток позволяет откладывать 10% дохода. SmartBudget рекомендует настроить автокопилку.', icon: <Lightbulb size={24} />}
];

export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Аналитика расходов</h1>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="chart-title">Расходы по категориям</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value}  ⃀`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> 
          <div className="chart-card">
            <h2 className="chart-title">Динамика по месяцам</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `${value} ⃀`} />
                 <Bar dataKey="Расходы" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
      <div className="ai-tips-section">
  <h2 className="ai-section-title">
    Наблюдения и Советы от SmartBudget AI
  </h2>
  <div className="ai-tips-grid">
    {aiTips.map((tip) => (
      <div key={tip.id} className="tip-card">
        <div className="tip-icon-wrapper">{tip.icon}</div>
        <div className="tip-content">
          <h3>{tip.title}</h3>
          <p>{tip.text}</p>
        </div>
      </div>
    ))}
  </div>
</div>
    </div>
  );
}
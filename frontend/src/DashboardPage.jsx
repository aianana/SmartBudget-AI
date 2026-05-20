import React, {useState, useEffect} from 'react';
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid} from 'recharts';
import './DashboardPage.css';

const categoryData = [ //временные данные
  {name: 'Еда и продукты', value: 15000 },
  {name: 'Жилье', value: 25000},
  {name: 'Транспорт', value: 5000},
  {name: 'Развлечения', value: 8000},
  {name: 'Подписки', value: 2000},
];

const monthlyData = [ //временные данные
  {name: 'Янв', Расходы: 45000 },
  {name: 'Фев', Расходы: 52000 },
  {name: 'Март', Расходы: 48000 },
  {name: 'Апр', Расходы: 61000 },
  {name: 'Май', Расходы: 55000 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
                <Tooltip formatter={(value) => `${value} ₽`} />
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
                  <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `${value} ₽`} />
                 <Bar dataKey="Расходы" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
}
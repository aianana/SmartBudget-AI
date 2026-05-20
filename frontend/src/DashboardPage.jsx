import React, {useState, useEffect} from 'react';
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import './DashboardPage.css';

const categoryData = [
  {name: 'Еда и продукты', value: 15000 },
  {name: 'Жилье', value: 25000},
  {name: 'Транспорт', value: 5000},
  {name: 'Развлечения', value: 8000},
  {name: 'Подписки', value: 2000},
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
      </div>
    </div>
  );
}
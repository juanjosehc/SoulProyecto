import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCOP } from '../../../../utils/currency';

const API = 'http://localhost:3000/api';

export const SalesChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/dashboard/sales-chart`);
        const chartData = await res.json();
        setData(chartData);
      } catch (error) {
        console.error('Error al cargar gráfico:', error);
        setData([
          { name: 'Lun', ventas: 0 }, { name: 'Mar', ventas: 0 }, { name: 'Mié', ventas: 0 },
          { name: 'Jue', ventas: 0 }, { name: 'Vie', ventas: 0 }, { name: 'Sáb', ventas: 0 }, { name: 'Dom', ventas: 0 }
        ]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="chart-card">
      <h3>Ventas por día</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `$${value / 1000000}M`} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ color: '#eab308' }} />
            <Line type="monotone" dataKey="ventas" stroke="#eab308" strokeWidth={2} dot={{ fill: '#18181b', stroke: '#eab308', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
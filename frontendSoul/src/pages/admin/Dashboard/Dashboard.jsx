import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { SalesChart } from './components/SalesChart';
import { TopProductsChart } from './components/TopProductsChart';
import { LowStockAlert } from './components/LowStockAlert';
import { formatCOP } from '../../../utils/currency';
import './Dashboard.css'; 

const API = 'http://localhost:3000/api';

export const Dashboard = () => {
  const [stats, setStats] = useState({ ventasHoy: 0, ventasTotal: 0, pedidosActivos: 0, totalClientes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/dashboard/stats`);
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error al cargar stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido al panel de administración de SOUL</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={DollarSign} title={formatCOP(stats.ventasHoy)} subtitle="Ventas del día" badge="Hoy" iconClass="icon-sales" />
        <StatCard icon={TrendingUp} title={formatCOP(stats.ventasTotal)} subtitle="Ventas totales" badge="Total" iconClass="icon-total" />
        <StatCard icon={ShoppingCart} title={String(stats.pedidosActivos)} subtitle="Pedidos activos" badge="Pendientes" iconClass="icon-orders" />
        <StatCard icon={Users} title={String(stats.totalClientes)} subtitle="Clientes registrados" badge="Activos" iconClass="icon-users" />
      </div>

      <div className="charts-grid">
        <SalesChart />
        <TopProductsChart />
      </div>

      <LowStockAlert />
    </div>
  );
};
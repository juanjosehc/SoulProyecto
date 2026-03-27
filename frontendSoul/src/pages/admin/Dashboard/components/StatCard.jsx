// src/pages/admin/Dashboard/components/StatCard.jsx
export const StatCard = ({ icon: Icon, title, subtitle, badge, iconClass }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`icon-wrapper ${iconClass}`}>
          <Icon size={20} />
        </div>
        <span className="badge">{badge}</span>
      </div>
      <div className="stat-card-body">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
};
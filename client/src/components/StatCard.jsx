import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = '#4f46e5',
  iconBg = '#e0e7ff',
  trend = null,
  trendDirection = 'up',
  trendText = '',
  sparklineData = null,
  sparklineColor = '#4f46e5',
}) => {
  // Simple SVG sparkline generator
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null;
    
    const width = 100;
    const height = 30;
    const padding = 2;
    
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal || 1;
    
    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - minVal) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="mini-chart" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={sparklineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const isTrendUp = trendDirection === 'up';

  return (
    <div className="glass-card stat-widget">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={20} />
        </div>
      </div>

      <div className="stat-body">
        <div>
          <div className="stat-value">{value}</div>
          {trend !== null ? (
            <div className={`stat-trend ${trendDirection}`}>
              {isTrendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{trendText}</span>
            </div>
          ) : trendText ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              {trendText}
            </div>
          ) : null}
        </div>
        {renderSparkline()}
      </div>
    </div>
  );
};

export default StatCard;

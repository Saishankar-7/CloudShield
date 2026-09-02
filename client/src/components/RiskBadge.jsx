const RiskBadge = ({ level }) => {
  const getRiskClass = () => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'badge-success';
      case 'medium':
        return 'badge-warning';
      case 'high':
        return 'badge-danger';
      case 'critical':
        return 'badge-danger'; // can add a custom style later if needed
      default:
        return 'badge-info';
    }
  };

  const getStyle = () => {
    if (level?.toLowerCase() === 'critical') {
      return {
        backgroundColor: '#7f1d1d', // dark red
        color: '#fca5a5'
      };
    }
    return {};
  };

  return (
    <span className={`badge ${getRiskClass()}`} style={getStyle()}>
      {level || 'Low'}
    </span>
  );
};

export default RiskBadge;

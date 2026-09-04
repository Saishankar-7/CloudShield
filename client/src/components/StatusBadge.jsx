const StatusBadge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'success':
      case 'resolved':
        return 'badge-success';
        
      case 'pending':
      case 'investigating':
      case 'open':
        return 'badge-warning';
        
      case 'denied':
      case 'blocked':
      case 'revoked':
      case 'inactive':
      case 'failed':
        return 'badge-danger';
        
      case 'expired':
      case 'dismissed':
      default:
        return 'badge-info';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

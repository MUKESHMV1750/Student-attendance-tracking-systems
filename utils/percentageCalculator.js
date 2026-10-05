const calculatePercentage = (present, total) => {
  if (total === 0) return 0;
  return parseFloat(((present / total) * 100).toFixed(2));
};

const getAttendanceStatus = (percentage) => {
  if (percentage >= 75) return { status: 'safe', color: 'success', label: 'Good Standing' };
  if (percentage >= 60) return { status: 'warning', color: 'warning', label: 'At Risk' };
  return { status: 'danger', color: 'danger', label: 'Below 75%' };
};

module.exports = { calculatePercentage, getAttendanceStatus };

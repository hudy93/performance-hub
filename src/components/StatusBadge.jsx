const statusMap = {
  completed: 'completed',
  'on-track': 'on-track',
  'at-risk': 'at-risk',
  behind: 'behind',
};

const labelMap = {
  completed: 'Erledigt',
  'on-track': 'Im Plan',
  'at-risk': 'Gefährdet',
  behind: 'Verzögert',
};

export default function StatusBadge({ status }) {
  const key = statusMap[status] || 'on-track';
  return <span className={`badge badge--${key}`}>{labelMap[key]}</span>;
}

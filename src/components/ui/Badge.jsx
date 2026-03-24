const styles = {
  complete:    'bg-success-50 text-success-700',
  in_progress: 'bg-primary-50 text-primary-700',
  not_yet:     'bg-gray-100 text-gray-500',
  action_needed: 'bg-warning-50 text-warning-700',
};
const labels = {
  complete: 'Complete',
  in_progress: 'In Progress',
  not_yet: 'Not Yet',
  action_needed: 'Action Needed',
};

export function Badge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.not_yet}`}>
      {labels[status] || status}
    </span>
  );
}

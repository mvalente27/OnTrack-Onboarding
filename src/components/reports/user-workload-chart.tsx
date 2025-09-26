// Stub for missing user-workload-chart
export default function UserWorkloadChart({ data }: { data?: { name: string; count: number }[] }) {
  return (
    <div>
      User Workload Chart (stub)
      {data && (
        <ul>
          {data.map((item, idx) => (
            <li key={idx}>{item.name}: {item.count}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

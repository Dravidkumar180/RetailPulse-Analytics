// Read-only evidence fields and related-record tables.
export function Evidence({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="dq-evidence">
      {Object.entries(data)
        .filter(([, v]) => !Array.isArray(v))
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k.replaceAll("_", " ")}</dt>
            <dd>{v === null ? "—" : String(v)}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Records({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length)
    return <p className="dq-muted">No related records available.</p>;

  const keys = Object.keys(rows[0]);

  return (
    <div className="dq-table-wrap">
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>{String(r[k] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { ArrowDownUp } from 'lucide-react';

export default function DataTable({ columns, rows, sortBy, sortOrder, onSort, empty = 'No records found' }) {
  return <div className="table-scroll"><table>
    <thead><tr>{columns.map((column) => <th key={column.key}>
      {column.sortable ? <button className="sort-button" onClick={() => onSort(column.key)}>{column.label}<ArrowDownUp size={13} /></button> : column.label}
    </th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={row.id}>{columns.map((column) =>
      <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>
    )}</tr>) : <tr><td className="empty-cell" colSpan={columns.length}>{empty}</td></tr>}</tbody>
  </table></div>;
}

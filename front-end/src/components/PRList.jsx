// src/components/PRList.jsx
import React from 'react'
import { Table, Button } from 'react-bootstrap'

export default function PRList({ prs }) {
  if (!prs.length) {
    return <p className="text-center text-muted">Nu ai niciun pull request trimis.</p>
  }

  return (
    <Table hover responsive className="shadow-sm bg-white rounded">
      <thead className="thead-light">
        <tr>
          <th>#</th>
          <th>Titlu PR</th>
          <th>Creat la</th>
          <th>Status</th>
          <th>Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        {prs.map((pr, idx) => (
          <tr key={pr.id}>
            <td>{idx + 1}</td>
            <td>{pr.title}</td>
            <td>{new Date(pr.createdAt).toLocaleDateString('ro-RO')}</td>
            <td>
              <span
                className={`badge ${
                  pr.status === 'OPEN'
                    ? 'badge-primary'
                    : pr.status === 'MERGED'
                    ? 'badge-success'
                    : 'badge-secondary'
                }`}
              >
                {pr.status}
              </span>
            </td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => (window.location = `/prs/${pr.id}`)}
              >
                Vezi detalii
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

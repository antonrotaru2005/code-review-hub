// src/components/UserProfile.jsx
import React from 'react'
import { Card, Row, Col, Image } from 'react-bootstrap'

export default function UserProfile({ user }) {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs={4} md={2}>
            <Image src={user.avatarUrl} roundedCircle fluid />
          </Col>
          <Col>
            <Card.Title>{user.name}</Card.Title>
            <Card.Text className="text-muted">{user.email}</Card.Text>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

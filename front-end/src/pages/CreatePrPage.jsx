// src/pages/CreatePrPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { FaCheckCircle } from 'react-icons/fa';
import { getUserInfo, getWebhookToken } from '../api/user';

export default function CreatePrPage() {
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState('Waiting for PR...');
  const [done, setDone] = useState(false);
  const [token, setToken] = useState(null);
  const didFetchRef = useRef(false);
  const navigate = useNavigate();

  // 1. Fetch the user data for the username
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    async function fetchUser() {
      try {
        const userData = await getUserInfo();
        setUser(userData);
        const t = await getWebhookToken();
        setToken(t);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // 2. Initialize WebSocket connection and subscribe using username
  useEffect(() => {
    if (!user) return;

    const socket = new SockJS('/ws-feedback');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      const username = user.username;
      client.subscribe(`/topic/feedback/${username}`, msg => {
        const body = JSON.parse(msg.body);
        if (body.status === 'done') {
          setStage('Done');
          setDone(true);
          client.deactivate();
        } else if (body.stage) {
          setStage(body.stage);
        }
      });
    };

    client.activate();
    return () => client.deactivate();
  }, [user]);

  // 3. Redirect at the end
  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => navigate('/user'), 2000);
      return () => clearTimeout(timer);
    }
  }, [done, navigate]);

  return (
    <Container className="my-5 text-center">
      <Card className="mb-4">
        <Card.Header>Configuration Instructions</Card.Header>
        <Card.Body>
          <ol>
            <li>
              In Bitbucket, go to <strong>Repository Settings&nbsp;→&nbsp;Webhooks</strong>.
            </li>
            <li>
              <strong>Add a new webhook with URL:</strong>{" "}
              {token ? (
                <strong>
                  <code>
                    {window.location.origin}/webhook/bitbucket/{token}
                  </code>
                </strong>
              ) : (
                <em>Generating your one-time link…</em>
              )}
            </li>
            <li>
              Select <strong>Pull Request events</strong> (created, updated).
            </li>
            <li>
              <strong>Save</strong> and then <strong>create a Pull Request</strong> in the repository.
            </li>
          </ol>

        </Card.Body>
      </Card>

      <h5>{stage}</h5>
      {!done && <Spinner animation="border" role="status" className="my-3" />}
      {done && (
        <Alert variant="success" className="d-inline-flex align-items-center">
          <FaCheckCircle size={24} className="me-2 text-success" />
          <span>Done!</span>
        </Alert>
      )}
    </Container>
  );
}

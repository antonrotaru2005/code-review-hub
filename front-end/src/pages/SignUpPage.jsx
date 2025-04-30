import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Button, Card, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import config from '../config';

// Note: Ensure you have installed the required dependencies:
// Run `npm install react-bootstrap bootstrap react-router-dom` in your project directory.

function SignUpPage() {
    const [userExists, setUserExists] = useState(false);
    const location = useLocation();

    // Check for error query parameter from backend
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('error') === 'user_exists') {
            setUserExists(true);
        }
    }, [location]);

    const handleSignUp = () => {
        // Redirect to Bitbucket OAuth endpoint with action=signup
        window.location.href = `${config.BACKEND_URL}/oauth2/authorization/bitbucket?action=signup`;
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
                <Container>
                    <Navbar.Brand as={Link} to="/">Code Review Hub</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/login">Login</Nav.Link>
                            <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main Content */}
            <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5 bg-light">
                <Container>
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-4">
                            <Card className="shadow-lg border-0 animate__animated animate__fadeIn">
                                <Card.Body className="p-5">
                                    <h2 className="text-center mb-4">Sign Up for Code Review Hub</h2>
                                    <p className="text-center text-muted mb-4">
                                        Create an account using your Bitbucket credentials
                                    </p>

                                    {/* Display error if user already exists */}
                                    {userExists && (
                                        <Alert variant="warning" className="text-center">
                                            An account with this Bitbucket user already exists.{' '}
                                            <Link to="/login" className="alert-link">
                                                Please log in instead.
                                            </Link>
                                        </Alert>
                                    )}

                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleSignUp}
                                            className="d-flex align-items-center justify-content-center"
                                            disabled={userExists}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                fill="currentColor"
                                                className="bi bi-person-plus me-2"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"
                                                />
                                            </svg>
                                            Sign Up with Bitbucket
                                        </Button>
                                    </div>
                                    <p className="text-center mt-4">
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-primary text-decoration-none">
                                            Log In
                                        </Link>
                                    </p>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </Container>
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white py-4">
                <Container>
                    <div className="row">
                        <div className="col-md-4">
                            <h5>Code Review Hub</h5>
                            <p>Empowering developers through collaboration and code review.</p>
                        </div>
                        <div className="col-md-4">
                            <h5>Quick Links</h5>
                            <ul className="list-unstyled">
                                <li><Link to="/about" className="text-white text-decoration-none">About</Link></li>
                                <li><Link to="/contact" className="text-white text-decoration-none">Contact</Link></li>
                                <li><Link to="/faq" className="text-white text-decoration-none">FAQ</Link></li>
                            </ul>
                        </div>
                        <div className="col-md-4">
                            <h5>Connect</h5>
                            <ul className="list-unstyled">
                                <li><a href="#" className="text-white text-decoration-none">Twitter</a></li>
                                <li><a href="#" className="text-white text-decoration-none">GitHub</a></li>
                                <li><a href="#" className="text-white text-decoration-none">LinkedIn</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="text-center mt-3">
                        <p className="mb-0">© {new Date().getFullYear()} Code Review Hub. All rights reserved.</p>
                    </div>
                </Container>
            </footer>
        </div>
    );
}

export default SignUpPage;
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Note: Ensure you have installed the required dependencies:
// Run `npm install react-bootstrap bootstrap react-router-dom` in your project directory.

function LoginPage() {
    const handleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/bitbucket-login";
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
                                    <h2 className="text-center mb-4">Login to Code Review Hub</h2>
                                    <p className="text-center text-muted mb-4">Sign in with your Bitbucket account to continue</p>
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleLogin}
                                            className="d-flex align-items-center justify-content-center"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                fill="currentColor"
                                                className="bi bi-box-arrow-in-right me-2"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
                                                />
                                            </svg>
                                            Login with Bitbucket
                                        </Button>
                                    </div>
                                    <p className="text-center mt-4">
                                        Don't have an account?{' '}
                                        <Link to="/signup" className="text-primary text-decoration-none">
                                            Sign Up
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

export default LoginPage;
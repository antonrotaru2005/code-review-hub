import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Note: Ensure you have installed the required dependencies:
// Run `npm install react-bootstrap bootstrap react-router-dom` in your project directory.

function HomePage() {
    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
                <Container>
                    <Navbar.Brand href="/">Code Review Hub</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/login">Login</Nav.Link>
                            <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Header with Carousel */}
            <header className="bg-primary text-white py-5">
                <Container>
                    <Carousel>
                        <Carousel.Item>
                            <div className="text-center py-5">
                                <h1 className="display-4">Welcome to Code Review Hub</h1>
                                <p className="lead">Collaborate, review, and improve your code with our community</p>
                            </div>
                        </Carousel.Item>
                        <Carousel.Item>
                            <div className="text-center py-5">
                                <h1 className="display-4">Join Our Community</h1>
                                <p className="lead">Connect with developers worldwide</p>
                            </div>
                        </Carousel.Item>
                    </Carousel>
                </Container>
            </header>

            {/* Main Content */}
            <main className="flex-grow-1 py-5">
                <Container>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body text-center">
                                    <h3 className="card-title">Code Collaboration</h3>
                                    <p className="card-text">Work together on projects with real-time code review tools.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body text-center">
                                    <h3 className="card-title">Learn & Grow</h3>
                                    <p className="card-text">Get feedback from experienced developers to improve your skills.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body text-center">
                                    <h3 className="card-title">Community Support</h3>
                                    <p className="card-text">Join discussions and share knowledge with our vibrant community.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-5">
                        <h2>Get Started Today</h2>
                        <p className="lead mb-4">Join our platform to start collaborating and improving your coding skills.</p>
                        <Button as={Link} to="/signup" variant="primary" size="lg" className="mx-2">Sign Up</Button>
                        <Button as={Link} to="/login" variant="outline-primary" size="lg" className="mx-2">Login</Button>
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

export default HomePage;
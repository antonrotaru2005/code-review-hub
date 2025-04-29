function HomePage(){
    return (
        <div className="container text-center mt-5">
            <h1 className="mb-4">Welcome to Code Review Hub</h1>
            <p className="lead">Please login to continue.</p>
            <a href="/login" className="btn btn-primary mt-3">Go to Login</a>
        </div>
    );
}

export default HomePage;
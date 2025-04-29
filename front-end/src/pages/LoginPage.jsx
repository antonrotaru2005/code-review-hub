function LoginPage(){
    const handleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/bitbucket";
    };

    return(
        <div className="container d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh'}}>
            <h1 className="mb-4">Login</h1>
            <button onClick={handleLogin} className="btn btn-success">Login with Bitbucket</button>
        </div>
    );
}

export default LoginPage;
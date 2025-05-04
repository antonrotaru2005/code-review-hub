// src/components/HomePage.jsx

import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const GlobalStyle = createGlobalStyle`
  /* Import hand-written Google Font */
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

  body {
    margin: 0;
    font-family: 'Segoe UI', Roboto, sans-serif;
    background: #f4f7fa;
    color: #333;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Nav = styled.nav`
  background: #fff;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  font-family: 'Pacifico', cursive;
  font-size: 1.75rem;
  color: #222;
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
`;

const NavLink = styled(Link)`
  margin-left: 1.5rem;
  position: relative;
  font-weight: 500;
  color: ${p => p.active ? '#40a9ff' : '#555'};
  &:hover {
    color: #40a9ff;
  }
  &::after {
    content: '';
    display: ${p => p.active ? 'block' : 'none'};
    width: 6px;
    height: 6px;
    background: #40a9ff;
    border-radius: 50%;
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const Main = styled.main`
  flex: 1;
`;

const Hero = styled.section`
  background: #fff;
  padding: 4rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media(max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const HeroText = styled.div`
  max-width: 500px;
`;

const HeroTitle = styled.h1`
  font-size: 2.75rem;
  margin: 0.5rem 0;
  color: #222;
`;

const HeroDesc = styled.p`
  color: #555;
  line-height: 1.6;
`;

const HeroButton = styled(Link)`
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  background: #40a9ff;
  color: #fff;
  border-radius: 4px;
  font-weight: 600;
  &:hover {
    background: #1890ff;
  }
`;

const HeroImage = styled.img`
  max-width: 450px;
  width: 100%;
  margin-left: 2rem;

  @media(max-width: 768px) {
    margin: 2rem 0 0;
  }
`;

const Features = styled.section`
  padding: 3rem 2rem;
  background: #f4f7fa;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px,1fr));
  gap: 1.5rem;
`;

const FeatureCard = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 1.75rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);

  h3 {
    margin-bottom: 0.5rem;
    color: #222;
  }
  p {
    color: #666;
    font-size: 0.95rem;
  }
`;

// --- Footer styles ---

const FooterContainer = styled.footer`
  background: #fff;
  padding: 3rem 2rem;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: auto;
`;

const FooterCol = styled.div`
  h4 {
    margin-bottom: 1rem;
    color: #222;
    font-weight: 600;
  }
  ul {
    list-style: none;
    padding: 0;
    li {
      margin-bottom: 0.6rem;
      a {
        color: #555;
        &:hover {
          color: #40a9ff;
        }
      }
    }
  }
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 1rem;

  a {
    font-size: 1.25rem;
    color: #555;
    &:hover {
      color: #40a9ff;
    }
  }
`;

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await getUserInfo();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      navigate('/');
    }
  };

  if (loading) return null;

  return (
    <>
      <GlobalStyle />
      <Page>
        <Nav>
          <Brand to="/">Code Review Hub</Brand>
          <NavItems>
            <NavLink to="/" active>Home</NavLink>
            <NavLink to="/features">Features</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/docs">Docs</NavLink>
            <NavLink to="/contact">Contact</NavLink>

            {user ? (
              <>
                <NavLink as="span">{user.name[0].toUpperCase()}</NavLink>
                <NavLink as="span" onClick={handleLogout}>Logout</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/signup">Sign Up</NavLink>
              </>
            )}
          </NavItems>
        </Nav>

        <Main>
          <Hero>
            <HeroText>
              <HeroTitle>Collaborate & Improve Your Code</HeroTitle>
              <HeroDesc>
                Analizează pull-request-uri, primește sugestii AI și lucrează împreună cu echipa
                pentru un workflow curat și cod de calitate superioară.
              </HeroDesc>
              <HeroButton to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Get Started"}
              </HeroButton>
            </HeroText>
            <HeroImage
              src="/assets/code-review-illustration.png"
              alt="Code review illustration"
            />
          </Hero>

          <Features>
            <FeaturesGrid>
              <FeatureCard>
                <h3>Pull Request Analysis</h3>
                <p>Inspectează automat modificările și primește un raport detaliat.</p>
              </FeatureCard>
              <FeatureCard>
                <h3>AI Suggestions</h3>
                <p>Obține recomandări de refactoring și optimizare de la motorul nostru AI.</p>
              </FeatureCard>
              <FeatureCard>
                <h3>Team Collaboration</h3>
                <p>Comentează și discută direct în interfață, în timp real.</p>
              </FeatureCard>
            </FeaturesGrid>
          </Features>
        </Main>

        <FooterContainer>
          <FooterGrid>
            <FooterCol>
              <h4>Code Review Hub</h4>
              <p>Empowering developers through AI-driven code reviews and real-time collaboration.</p>
            </FooterCol>

            <FooterCol>
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/docs">Docs</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
              </ul>
            </FooterCol>

            <FooterCol>
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </FooterCol>

            <FooterCol>
              <h4>Connect</h4>
              <SocialIcons>
                <a href="#" aria-label="Twitter"><FaTwitter /></a>
                <a href="#" aria-label="GitHub"><FaGithub /></a>
                <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
              </SocialIcons>
            </FooterCol>
          </FooterGrid>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: '#999',
            fontSize: '0.85rem'
          }}>
            © {new Date().getFullYear()} Code Review Hub. All rights reserved.
          </div>
        </FooterContainer>
      </Page>
    </>
  );
}

export default HomePage;

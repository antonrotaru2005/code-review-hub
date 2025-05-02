import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import styled from 'styled-components';

// Styled Components
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f0f2f5;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #212121;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  color: #ffffff;
  font-weight: bold;
  text-decoration: none;
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
`;

const NavLinkStyled = styled(Link)`
  color: #d1d1d1;
  margin-left: 1.5rem;
  text-decoration: none;
  font-size: 1rem;
  &:hover {
    color: #ffffff;
  }
`;

const LogoutButton = styled.button`
  margin-left: 1.5rem;
  padding: 0;
  background: none;
  border: none;
  color: #d1d1d1;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    color: #ffffff;
  }
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
`;

const HeroTitle = styled.h1`
  font-size: 2.8rem;
  margin-bottom: 1rem;
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  max-width: 600px;
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 4rem 2rem;
`;

const FeatureCard = styled.div`
  background: #ffffff;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const FeatureTitle = styled.h3`
  margin-bottom: 0.75rem;
  color: #333333;
`;

const FeatureText = styled.p`
  color: #555555;
`;

const CTASection = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
`;

const CTATitle = styled.h2`
  margin-bottom: 1rem;
  color: #212121;
`;

const CTAText = styled.p`
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #555555;
`;

const CTAButtonPrimary = styled(Link)`
  display: inline-block;
  margin: 0 0.5rem;
  padding: 0.75rem 1.75rem;
  background: #667eea;
  color: #ffffff;
  border-radius: 5px;
  text-decoration: none;
  font-size: 1rem;
  &:hover {
    background: #5a67d8;
  }
`;

const CTAButtonOutline = styled(Link)`
  display: inline-block;
  margin: 0 0.5rem;
  padding: 0.75rem 1.75rem;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 5px;
  text-decoration: none;
  font-size: 1rem;
  &:hover {
    background: #667eea;
    color: #ffffff;
  }
`;

const Footer = styled.footer`
  background: #212121;
  color: #bbbbbb;
  padding: 3rem 2rem;
  margin-top: auto;
`;

const FooterColumns = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const FooterColumn = styled.div`
  flex: 1 1 200px;
  margin-bottom: 2rem;
`;

const FooterTitle = styled.h5`
  color: #ffffff;
  margin-bottom: 1rem;
`;

const FooterList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FooterItemLink = styled(Link)`
  display: block;
  color: #bbbbbb;
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  &:hover {
    color: #ffffff;
  }
`;

const FooterExternalLink = styled.a`
  display: block;
  color: #bbbbbb;
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  &:hover {
    color: #ffffff;
  }
`;

const Copyright = styled.p`
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #888888;
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

  if (loading) {
    return null;
  }

  return (
    <PageWrapper>
      {/* Navigation */}
      <NavBar>
        <Logo to="/">Code Review Hub</Logo>
        <NavMenu>
          {user ? (
            <>  
              <NavLinkStyled to="/user">{user.name[0].toUpperCase()}</NavLinkStyled>
              <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
            </>
          ) : (
            <>  
              <NavLinkStyled to="/login">Login</NavLinkStyled>
              <NavLinkStyled to="/signup">Sign Up</NavLinkStyled>
            </>
          )}
        </NavMenu>
      </NavBar>

      {/* Hero */}
      <HeroSection>
        <HeroTitle>Welcome to Code Review Hub</HeroTitle>
        <HeroSubtitle>Collaborate, review, and improve your code with our community.</HeroSubtitle>
      </HeroSection>

      {/* Features */}
      <FeaturesSection>
        <FeatureCard>
          <FeatureTitle>Code Collaboration</FeatureTitle>
          <FeatureText>Work together on projects with real-time code review tools.</FeatureText>
        </FeatureCard>
        <FeatureCard>
          <FeatureTitle>Learn & Grow</FeatureTitle>
          <FeatureText>Get feedback from experienced developers to improve your skills.</FeatureText>
        </FeatureCard>
        <FeatureCard>
          <FeatureTitle>Community Support</FeatureTitle>
          <FeatureText>Join discussions and share knowledge with our vibrant community.</FeatureText>
        </FeatureCard>
      </FeaturesSection>

      {/* Call to Action */}
      <CTASection>
        <CTATitle>Get Started Today</CTATitle>
        <CTAText>Join our platform to start collaborating and improving your coding skills.</CTAText>
        <CTAButtonPrimary to="/signup">Sign Up</CTAButtonPrimary>
        <CTAButtonOutline to="/login">Login</CTAButtonOutline>
      </CTASection>

      {/* Footer */}
      <Footer>
        <FooterColumns>
          <FooterColumn>
            <FooterTitle>Code Review Hub</FooterTitle>
            <p>Empowering developers through collaboration and code review.</p>
          </FooterColumn>
          <FooterColumn>
            <FooterTitle>Quick Links</FooterTitle>
            <FooterList>
              <li><FooterItemLink to="/about">About</FooterItemLink></li>
              <li><FooterItemLink to="/contact">Contact</FooterItemLink></li>
              <li><FooterItemLink to="/faq">FAQ</FooterItemLink></li>
            </FooterList>
          </FooterColumn>
          <FooterColumn>
            <FooterTitle>Connect</FooterTitle>
            <FooterList>
              <li><FooterExternalLink href="#">Twitter</FooterExternalLink></li>
              <li><FooterExternalLink href="#">GitHub</FooterExternalLink></li>
              <li><FooterExternalLink href="#">LinkedIn</FooterExternalLink></li>
            </FooterList>
          </FooterColumn>
        </FooterColumns>
        <Copyright>© {new Date().getFullYear()} Code Review Hub. All rights reserved.</Copyright>
      </Footer>
    </PageWrapper>
  );
}

export default HomePage;

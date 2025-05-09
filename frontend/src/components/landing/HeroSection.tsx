import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="hero-title">
              Modern Learning Management for the Digital Classroom
            </h1>
            <p className="hero-subtitle">
              ClassConnect helps teachers and students collaborate effectively with an intuitive platform for assignments, grades, and classroom communication.
            </p>
            <div className="hero-buttons">
              <Link to="/teacher/signup">
                <Button variant="secondary" size="lg">
                  Teacher Sign Up
                </Button>
              </Link>
              <Link to="/student/signup">
                <Button variant="primary" size="lg">
                  Student Sign Up
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero-image-container">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Students collaborating on digital devices" 
              className="hero-image"
            />
          </div>
        </div>
      </div>
      <div className="hero-shape">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;

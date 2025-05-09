import React from 'react';
import NavBar from '../components/common/NavBar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <NavBar />
      <HeroSection />
      <FeaturesSection />

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-title">
          <h2>How ClassConnect Works</h2>
          <p>Our platform makes it easy for teachers to create engaging learning experiences and for students to stay organized.</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Create or Join a Class</h3>
              <p className="step-description">
                Teachers can create classes and share a unique class code with students. Students use this code to join the class.
              </p>
            </div>
            <div className="step-image">
              <img
                src="https://images.unsplash.com/photo-1571260899304-425eee4c7efd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80"
                alt="Creating a class"
              />
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Create and Assign Work</h3>
              <p className="step-description">
                Teachers create assignments, quizzes, and materials for students. Set due dates and track student progress.
              </p>
            </div>
            <div className="step-image">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80"
                alt="Creating assignments"
              />
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">Submit and Grade Work</h3>
              <p className="step-description">
                Students submit their work through the platform. Teachers review submissions, provide feedback, and assign grades.
              </p>
            </div>
            <div className="step-image">
              <img
                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1350&q=80"
                alt="Grading assignments"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-title">
          <h2>What Our Users Say</h2>
          <p>Hear from teachers and students who are using ClassConnect to transform their educational experience.</p>
        </div>
        <div className="testimonials-container">
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                ClassConnect has revolutionized how I manage my classroom. Creating and grading assignments is so much easier now, and I love being able to provide immediate feedback to my students.
              </div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <img src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sarah Johnson" />
                </div>
                <div className="testimonial-info">
                  <h4>Sarah Johnson</h4>
                  <p>High School Math Teacher</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                As a student, I appreciate how organized everything is in ClassConnect. I can see all my assignments in one place, and the reminders help me stay on top of my work.
              </div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <img src="https://randomuser.me/api/portraits/men/46.jpg" alt="Jason Lee" />
                </div>
                <div className="testimonial-info">
                  <h4>Jason Lee</h4>
                  <p>College Student</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                The communication features in ClassConnect have improved engagement in my classes. Students are more likely to ask questions and participate in discussions.
              </div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Maria Rodriguez" />
                </div>
                <div className="testimonial-info">
                  <h4>Maria Rodriguez</h4>
                  <p>Middle School Science Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
      <Footer />
    </div>
  );
};

export default LandingPage;

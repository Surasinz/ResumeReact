import Card from './Card';
import './style/Education.css';

function Education() {
  return (
      <Card title="Education">
      <div className="education-card">
        <div className="education-info">
          <h3>Panyapiwat Institute of Management</h3>
          <p className="education-title">B.Eng. in Computer Engineering and Artificial Intelligence GPA: 3.62</p>
          <div className="education-address">
             Pak Kred, Nonthaburi, Thailand (2021–2025)
          </div>
        </div>
            <div className="education-image">
          <img
            src="https://i.ibb.co/y7kPXJN/favpng-c32d5fca0d424166a9fa563624b23e46.png" 
            alt="panyapiwat-logo"
          />
        </div>
      </div>
            <div className="education-card">
        <div className="education-info">
          <h3>Phichit Pittayakom School</h3>
          <p className="education-title">Senior High School in STEM-Program GPA: 3.78</p>
          <div className="education-address">
              Mueang, Phichit, Thailand (2018-2021)
          </div>
        </div>
            <div className="education-image">
          <img
            src="https://i.ibb.co/nMxcrsJV/image-removebg-preview.png"
            alt="phichitpittakom-logo"
          />
        </div>
      </div>
      
    </Card>
  );
}

export default Education;

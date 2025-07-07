import Card from './Card';
import './style/Profile.css';

function Profile() {
  return (
    <Card title="Profile">
      <div className="profile-card">
        <div className="profile-image">
          <img
            src="https://i.ibb.co/8nT6j77g/Image-4-removebg-preview.png"
            alt="Profile"
          />
        </div>
        <div className="profile-info">
          <h3>Mr.Surachet Panto</h3>
          <p className="profile-title">Software Enginear</p>
          <div className="profile-address">
             Soi Ladprao 54, Ladprao Rd., Wang Thonglang, Wang Thonglang Bangkok Thailand 10310
          </div>
          <p className="profile-description">
              Tel : (+66) 882822749
          </p>
        </div>
      </div>
    </Card>
  );
}

export default Profile;

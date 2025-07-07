import './style/Card.css';

function Card({ title, icon, children }) {
  return (
    <section className="card">
      {icon && (
        <div className="card-icon">
          <img src={icon} alt={title} />
        </div>
      )}
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default Card;

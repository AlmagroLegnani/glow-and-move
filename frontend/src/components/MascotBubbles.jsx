import mascotImg from '../assets/mascot/mascot.jpg';
import './MascotBubbles.css';

const BUBBLES = [
  { size: 68, left: '6%', duration: 16, delay: 0 },
  { size: 44, left: '85%', duration: 13, delay: 4 },
  { size: 54, left: '45%', duration: 19, delay: 8 },
  { size: 38, left: '68%', duration: 15, delay: 12 },
];

export default function MascotBubbles() {
  return (
    <div className="mascot-bubbles" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="mascot-bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <img src={mascotImg} alt="" />
        </span>
      ))}
    </div>
  );
}

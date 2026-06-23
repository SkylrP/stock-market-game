import './HelpModal.css';

const helpSections = [
  { title: 'Objective', text: 'Reach $100k total value (cash + stocks at current price).' },
  { title: 'Lucky Numbers', text: 'Pick a unique 1\u20136 before the game. Rolling your number = salary that turn.' },
  { title: 'Going to Work', text: 'Start of the game. Earn $400 per lucky roll. Enter the market and start moving along the board at $1,200.' },
  { title: 'Playing the Market', text: 'Move around the board. Lucky number earns $200 instead. Each player enters individually.' },
  { title: 'Stock Squares (\u25b2/\u25bc)', text: 'Buy the stock as marked on the square. Change QBI which drives all stock prices. Dividends earned if you already own shares.' },
  { title: 'Stock Meeting (M)', text: 'Own shares? Spin the slot machine to gain more. Able to buy 1 if needed.' },
  { title: 'Fees ($100 / Broker)', text: '$100 flat fee or $5 per share owned for broker.' },
  { title: 'Market Manipulator (\u26a1)', text: 'Roll 2 dice \u2192 raise or lower QBI by the product \u2192 buy or sell one stock.' },
  { title: 'Portfolio', text: 'Tap any stock to sell it (before rolling). Shows P&L per stock.' },
  { title: 'Pass & Play', text: 'Roll, resolve your square, End Turn, hand the device to the next player.' },
];

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>How to Play</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="help-list">
          {helpSections.map(s => (
            <div key={s.title} className="help-item">
              <span className="help-title">{s.title}</span>
              <span className="help-text">{s.text}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-block skip-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
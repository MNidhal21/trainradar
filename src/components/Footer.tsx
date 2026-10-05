import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-disclaimer">
          <strong>TrainRadar</strong> is an independent open project. Unofficial and unaffiliated with Indian Railways or the Ministry of Railways. Live positional data powered by RailRadar API.
        </p>
        <p className="footer-meta">
          $0 Serverless Stack � GitHub Pages + Supabase Realtime
        </p>
      </div>
    </footer>
  );
};

// components/common/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white text-center p-4 mt-auto">
      © {new Date().getFullYear()} UniTimetableAI. Todos los derechos reservados.
    </footer>
  );
};

export default Footer;

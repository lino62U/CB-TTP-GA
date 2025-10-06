// components/teacher/SubmitButton.tsx
import React from 'react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

interface SubmitButtonProps {
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading }) => (
  <Button type="submit" size="lg" disabled={loading}>
    {loading ? <><Spinner /> Guardando...</> : 'Guardar y Enviar Datos'}
  </Button>
);

export default SubmitButton;
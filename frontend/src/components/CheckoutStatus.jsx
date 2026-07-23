import './CheckoutStatus.css';

const CONTENT = {
  exito: {
    title: '¡Pago aprobado!',
    message: 'Ya activamos tu plan. Podés revisar los detalles desde "Mi perfil".',
  },
  pendiente: {
    title: 'Pago pendiente',
    message: 'Tu pago está siendo procesado. Te avisamos por email en cuanto se confirme.',
  },
  error: {
    title: 'No pudimos procesar el pago',
    message: 'Algo falló con Mercado Pago. Podés intentar de nuevo desde la sección de Planes.',
  },
};

export default function CheckoutStatus({ status }) {
  const { title, message } = CONTENT[status] || CONTENT.error;

  return (
    <div className="checkout-status">
      <div className="container checkout-status__card">
        <h1>{title}</h1>
        <p>{message}</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

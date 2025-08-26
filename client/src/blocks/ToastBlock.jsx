const Toast = ({ message, type = "success", onClose }) => {
  
  return (
    <div className={`toast ${type}`}>
      {message}
      <button onClick={onClose}>✕</button>
    </div>
  );
};

export default Toast;

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-save" onClick={onConfirm}>Sí</button>
          <button className="btn-delete" onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

const AdminOrderCommentBlock = ({
  comment,
  trackingNumber,
  shippingCompany,
  onFieldChange,
}) => {
  return (
    <div className="admin-order-comment-block">
      <label>
        Comentario del administrador:
        <textarea
          value={comment}
          onChange={(e) => onFieldChange("adminComment", e.target.value)}
        />
      </label>

      <label>
        Número de guía:
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => onFieldChange("trackingNumber", e.target.value)}
        />
      </label>

      <label>
        Transportadora:
        <input
          type="text"
          value={shippingCompany}
          onChange={(e) => onFieldChange("shippingCompany", e.target.value)}
        />
      </label>
    </div>
  );
};

export default AdminOrderCommentBlock;

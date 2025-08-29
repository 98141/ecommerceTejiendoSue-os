exports.serializeOrderForAdmin = (order) => {
  if (!order) return null;
  return {
    _id: order._id,
    user: order.user,          
    items: order.items,        
    total: order.total,
    status: order.status,
    trackingNumber: order.trackingNumber,
    shippingCompany: order.shippingCompany,
    adminComment: order.adminComment,
    shippingInfo: order.shippingInfo || null,   
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

exports.serializeOrderForUser = (order) => {
  if (!order) return null;
  return {
    _id: order._id,
    items: order.items,
    total: order.total,
    status: order.status,
    trackingNumber: order.trackingNumber || "",
    shippingCompany: order.shippingCompany || "",
    adminComment: order.adminComment || "",
    shippingInfo: order.shippingInfo || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

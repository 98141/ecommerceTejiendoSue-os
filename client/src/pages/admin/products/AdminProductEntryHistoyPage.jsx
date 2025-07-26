import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimesCircle  } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../../contexts/AuthContext";

const AdminProductEntryHistoryPage = () => {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/products/history/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(res.data);
    } catch (err) {
      console.error("Error al obtener historial de productos", err);
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = history.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(history.length / itemsPerPage);

  const handleCancel = () => {
    // Si necesitas confirmar con el usuario:
    // if (window.confirm("¿Estás seguro de cancelar los cambios?")) {
    navigate("/admin/products");
    // }
  };

  return (
    <div className="history-container">
      <h2>Historial de productos ingresados</h2>
      <button
        onClick={handleCancel}
        title="Cancelar cambios y volver"
        style={{ backgroundColor: "#ccc", color: "#333" }}
      >
        <FaTimesCircle style={{ marginRight: "6px" }} />
        Cancelar
      </button>

      <table className="history-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Variantes</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, i) => (
            <tr key={i}>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>${item.price}</td>
              <td>
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>Talla</th>
                      <th>Color</th>
                      <th>Stock inicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.variants.map((v, j) => (
                      <tr key={j}>
                        <td>{v.size?.label || "—"}</td>
                        <td>{v.color?.name || "—"}</td>
                        <td>{v.initialStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminProductEntryHistoryPage;

// =========================================================
// 1. ESCUCHAR FIRESTORE EN TIEMPO REAL
// =========================================================
if (typeof db !== 'undefined') {
  db.collection("platillos").onSnapshot((coleccion) => {
    coleccion.docChanges().forEach((registro) => {
      // Invocamos las funciones de UI que se declararon en index.js
      if (registro.type === "added") {
        mostrarPlatillo(registro.doc.data(), registro.doc.id);
      }
      if (registro.type === "modified") {
        actualizarPlatillo(registro.doc.data(), registro.doc.id);
      }
      if (registro.type === "removed") {
        borrarPlatillo(registro.doc.id);
      }
    });
  });
}

// =========================================================
// 2. ELIMINAR PLATILLO EN FIRESTORE AL HACER CLIC
// =========================================================
const contenedorRecetasDB = document.querySelector(".recipes");

if (contenedorRecetasDB) {
  contenedorRecetasDB.addEventListener("click", (e) => {
    if (e.target.tagName === "I") {
      const id = e.target.getAttribute("data-id");
      
      if (id && confirm("¿Seguro que deseas eliminar este platillo?")) {
        db.collection("platillos").doc(id).delete()
          .then(() => {
            M.toast({ html: 'Platillo eliminado correctamente', classes: 'rounded green' });
          })
          .catch((error) => {
            console.error("Error al eliminar el platillo:", error);
            M.toast({ html: 'Error al eliminar el platillo', classes: 'rounded red' });
          });
      }
    }
  });
}
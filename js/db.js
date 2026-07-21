let contenidoLista = "";

 db.collection("platillos").onSnapshot((coleccion) => {
     coleccion.docChanges().forEach((registro) => {
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

const formularioAgregar = document.querySelector("form");
formularioAgregar.addEventListener("submit", (e) => {
    e.preventDefault();
const platilloNuevo = {
    nombre: formularioAgregar.title.value,
    ingredientes: formularioAgregar.ingredients.value,
    precio: formularioAgregar.price.value
}
db.collection("platillos").add(platilloNuevo)
.catch((error) => {
    console.error(error);
    alert("Error al agregar el platillo");
});
    formularioAgregar.title.value = "";
    formularioAgregar.ingredients.value = "";
    formularioAgregar.price.value = "";
    alert("Platillo agregado correctamente");
});


const platilloBorrar = document.querySelector(".recipes");
platilloBorrar.addEventListener("click", (e) => {
    if (e.target.tagName === "I") {
        const id = e.target.getAttribute("data-id");
        const confirmar = confirm("¿Seguro que deseas eliminar este platillo?");
        if (confirmar) {
            db.collection("platillos").doc(id).delete()
            .then(() => {
                alert("Platillo eliminado correctamente");
            })
            .catch((error) => {
                console.error(error);
                alert("Error al eliminar el platillo");
            });
        }
    }
});

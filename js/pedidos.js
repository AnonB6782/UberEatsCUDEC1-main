// Variable global para renderizar las opciones del select de platillos
let contenidoLista = "<option value='' disabled selected>-- Elige un platillo de la carta --</option>";

// Variable global para controlar la instancia del mapa Leaflet
let miMapa = null;

document.addEventListener('DOMContentLoaded', function() {
  // 1. Inicialización de componentes de Materialize (Sidenav)
  const menus = document.querySelectorAll('.side-menu');
  if (menus.length > 0 && typeof M !== 'undefined') {
    M.Sidenav.init(menus, { edge: 'right' });
  }

  // 2. Evento del botón para obtener la ubicación actual
  const btnUbicacion = document.getElementById("btnUbicacion");
  if (btnUbicacion) {
    btnUbicacion.addEventListener("click", function() {
      if (navigator.geolocation) {
        M.toast({ html: 'Obteniendo coordenadas...', classes: 'rounded orange' });
        navigator.geolocation.getCurrentPosition(exito, error);
      } else {
        alert("Este navegador no soporta geolocalización");
      }
    });
  }

  // 3. Manejo del formulario para guardar en Firebase (Colección: pedidos1)
  const formularioPedido = document.getElementById("formularioPedido");
  if (formularioPedido) {
    formularioPedido.addEventListener("submit", function(e) {
      e.preventDefault();

      const selectPlatillo = document.getElementById("listaplatillos");
      const idPlatillo = selectPlatillo.value;
      const nombrePlatillo = selectPlatillo.options[selectPlatillo.selectedIndex].text;

      const pedidoNuevo = {
        platilloId: idPlatillo,
        platilloNombre: nombrePlatillo,
        cliente: document.getElementById("txtNombre").value,
        direccion: document.getElementById("txtDireccion").value,
        fecha: new Date().toISOString()
      };

      if (typeof db !== 'undefined') {
        db.collection("pedidos1").add(pedidoNuevo)
          .then(() => {
            M.toast({ html: '¡Pedido registrado con éxito!', classes: 'rounded green' });
            formularioPedido.reset();
            
            const txtUbicacion = document.getElementById("ubicacion");
            if (txtUbicacion) txtUbicacion.innerHTML = "";
            
            // Re-inicializamos la vista del select tras limpiar el formulario
            M.FormSelect.init(selectPlatillo);
          })
          .catch((err) => {
            console.error("Error al guardar pedido: ", err);
            M.toast({ html: 'Error al registrar el pedido', classes: 'rounded red' });
          });
      }
    });
  }
});

// =========================================================
// MONITOREO EN TIEMPO REAL DE FIRESTORE (PLATILLOS / RECIPES)
// =========================================================
if (typeof db !== 'undefined') {
  // Se lee la colección 'recipes' (o 'platillos', ajusta según tu base de datos)
  db.collection("recipes").onSnapshot((coleccion) => {
    contenidoLista = "<option value='' disabled selected>-- Elige un platillo de la carta --</option>";
    
    coleccion.forEach((registro) => {
      agregarALista(registro.data(), registro.id);
    });

    const selectElement = document.getElementById("listaplatillos");
    if (selectElement) {
      selectElement.innerHTML = contenidoLista;
      
      // Actualiza la interfaz gráfica de Materialize Select
      if (typeof M !== 'undefined' && M.FormSelect) {
        M.FormSelect.init(selectElement);
      }
    }
  });
}

function agregarALista(platillo, id) {
  // Soportar ambas nomenclaturas: (title/price) de 'recipes' o (nombre/precio) de 'platillos'
  const nombre = platillo.title || platillo.nombre;
  const precio = platillo.price !== undefined ? platillo.price : platillo.precio;

  // Solo agregar si el nombre y el precio existen
  if (nombre && precio !== undefined) {
    contenidoLista += `<option value='${id}'>${nombre} - $${precio} MXN</option>`;
  }
}

// =========================================================
// FUNCIONES DE GEOLOCALIZACIÓN Y MAPA (LEAFLET)
// =========================================================
function exito(posicion) {
  let latitud = posicion.coords.latitude;
  let longitud = posicion.coords.longitude;

  // Consulta de dirección mediante Nominatim (Reverse Geocoding)
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json`, {
    headers: {
      'User-Agent': 'UberEatsCUDECEnrique (enrique_udec@hotmail.com)'
    }
  })
  .then(respuesta => respuesta.json())
  .then(data => {
    let ciudad = data.address.city || data.address.town || data.address.village || "No especificada";
    let pais = data.address.country || "No especificado";
    
    // Muestra Ciudad y País en el span #ubicacion
    const elemUbicacion = document.getElementById("ubicacion");
    if (elemUbicacion) {
      elemUbicacion.innerHTML = `${ciudad}, ${pais}`;
    }
    
    // Autocompleta el input de dirección
    const direccionCaja = document.getElementById("txtDireccion");
    if (direccionCaja) {
      direccionCaja.value = data.display_name;
      M.updateTextFields();
    }

    // Renderiza o actualiza el mapa Leaflet en el contenedor #mapa
    const contenedorMapa = document.getElementById('mapa');
    if (contenedorMapa && typeof L !== 'undefined') {
      
      if (miMapa) {
        // Si el mapa ya existe, simplemente lo reubicamos y actualizamos el pin
        miMapa.setView([latitud, longitud], 15);
        L.marker([latitud, longitud]).addTo(miMapa)
          .bindPopup('<b>Ubicación de entrega</b>')
          .openPopup();
      } else {
        // Si se crea por primera vez
        miMapa = L.map('mapa').setView([latitud, longitud], 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(miMapa);

        L.marker([latitud, longitud]).addTo(miMapa)
          .bindPopup('<b>Ubicación de entrega</b>')
          .openPopup();
      }
    }
  })
  .catch(error => console.error("Error obteniendo dirección: ", error));
}

function error(err) {
  alert("Error al obtener ubicación");
  console.error("Geolocalización denegada o con error: ", err);
}
let contenidoLista = "<option value='' disabled selected>-- Elige un platillo de la carta --</option>";

document.addEventListener('DOMContentLoaded', function() {
  // 1. Inicialización de componentes de Materialize (Sidenav)
  const menus = document.querySelectorAll('.side-menu');
  M.Sidenav.init(menus, {edge: 'right'});

  // =========================================================
  // CORRECCIÓN: ASIGNAR LA ACCIÓN AL BOTÓN DE LA UI
  // =========================================================
  const btnUbicacion = document.getElementById("btnUbicacion");
  if (btnUbicacion) {
    btnUbicacion.addEventListener("click", function() {
      if (navigator.geolocation) {
        M.toast({html: 'Obteniendo coordenadas...', classes: 'rounded orange'});
        navigator.geolocation.getCurrentPosition(exito, error);
      } else {
        alert("Este navegador no soporta geolocalización");
      }
    });
  }

  // 2. Manejo del formulario para guardar en Firebase (Colección: pedidos1)
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

      db.collection("pedidos1").add(pedidoNuevo)
        .then(() => {
          M.toast({html: '¡Pedido registrado con éxito!', classes: 'rounded green'});
          formularioPedido.reset();
          document.getElementById("ubicacion").innerHTML = "";
        })
        .catch((err) => {
          console.error("Error al guardar pedido: ", err);
        });
    });
  }
});

// Monitoreo en tiempo real de la colección de platillos
db.collection("platillos").onSnapshot((coleccion) => {
    contenidoLista = "<option value='' disabled selected>-- Elige un platillo de la carta --</option>";
    coleccion.forEach((registro) => {
        agregarALista(registro.data(), registro.id);
    });
    const selectElement = document.getElementById("listaplatillos");
    if (selectElement) {
      selectElement.innerHTML = contenidoLista;
    }
});

function agregarALista(platillo, id) {
    contenidoLista += `<option value='${id}'>${platillo.nombre}</option>`;
}

// =========================================================
// FUNCIONES DE ÉXITO Y ERROR (AJUSTADAS A TU HTML)
// =========================================================
function exito(posicion) {
  let latitud = posicion.coords.latitude;
  let longitud = posicion.coords.longitude;

  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json`, {
    headers: {
      'User-Agent': 'UberEatsCUDECEnrique (enrique_udec@hotmail.com)'
    }
  })
  .then(respuesta => respuesta.json())
  .then(data => {
    let ciudad = data.address.city || data.address.town || data.address.village || "No especificada";
    let pais = data.address.country || "No esepecificado";
    
    // Inyectamos ciudad y país en la interfaz
    document.getElementById("ubicacion").innerHTML = `${ciudad}, ${pais}`;
    
    // Autocompletamos la caja de texto con la calle exacta
    const direccionCaja = document.getElementById("txtDireccion");
    if (direccionCaja) {
      direccionCaja.value = data.display_name;
      M.textareaAutoResize(direccionCaja);
      M.updateTextFields();
    }

    // Inicialización del mapa (Usando tu ID 'mapa' en lugar de 'map')
    var map = L.map('mapa').setView([latitud, longitud], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Añadimos el pin marcador en las coordenadas reales
    L.marker([latitud, longitud]).addTo(map)
        .bindPopup('<b>Ubicación de entrega</b>')
        .openPopup();
  })
  .catch(error => console.error(error));
}

function error(err) {
  alert("Error al obtener ubicación");
  console.log(err);
}
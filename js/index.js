// Variable global para renderizar el HTML dinámicamente
let contenido = "";

// UN SOLO DOMCONTENTLOADED PARA EVITAR ENVIOS DUPLICADOS O DOCUMENTOS SEPARADOS
document.addEventListener('DOMContentLoaded', function() {
  
  // 1. INICIALIZACIÓN DE COMPONENTES INTERNOS DE MATERIALIZE
  // Inicialización explícita por ID para asegurar que coincidan con los data-target
  const menuElem = document.getElementById('side-menu');
  if (menuElem) {
    M.Sidenav.init(menuElem, { edge: 'right' });
  }

  const formElem = document.getElementById('side-form');
  if (formElem) {
    M.Sidenav.init(formElem, { edge: 'left' });
  }

  // 2. VARIABLES DE CONTROL DE LA CÁMARA
  let streaming = false;
  const width = 320;
  let height = 0;
  let camaraStream = null; // Guarda el flujo activo para poder apagarlo

  // Enlaces a elementos HTML por ID
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const bntFoto = document.getElementById('btnFoto');
  const btnCapturar = document.getElementById('btnCapturar');
  const formularioAgregar = document.querySelector(".add-recipe"); 

  // 3. LÓGICA PARA ENCENDER LA CÁMARA
  if (bntFoto) {
    bntFoto.addEventListener("click", function() {
      navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
      })
      .then((stream) => {
          camaraStream = stream; // Guardamos el stream actual en la variable controladora
          video.srcObject = stream;
          video.play();
      })
      .catch((error) => {
          console.error("Error al acceder a la cámara: ", error);
          M.toast({ html: 'No se pudo acceder a la cámara' });
      });
    });
  }

  // Ajuste automático de proporciones del visor de video
  if (video) {
    video.addEventListener("canplay", () => {
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth / width);
        video.setAttribute("width", width);
        video.setAttribute("height", height);
        streaming = true;
      }
    });
  }

  // Capturar foto al oprimir el botón físico
  if (btnCapturar) {
    btnCapturar.addEventListener("click", (e) => {
      e.preventDefault();
      tomarFoto();
    });
  }

  // FUNCIÓN PARA DESACTIVAR Y APAGAR LA CÁMARA COMPLETAMENTE
  function apagarCamara() {
    if (camaraStream) {
      camaraStream.getTracks().forEach(track => track.stop());
      camaraStream = null;
    }
    if (video) {
      video.srcObject = null;
    }
    streaming = false;
  }

  // Función interna para procesar la imagen a Base64 sin prefijos ni espacios
  function tomarFoto() {
    const contexto = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      contexto.drawImage(video, 0, 0, width, height);
      const fotoCompleta = canvas.toDataURL("image/png");
      
      const preview = document.getElementById("fotoPreview");
      if (preview) preview.setAttribute("src", fotoCompleta);
      
      const base64Puro = fotoCompleta.replace("data:image/png;base64,", "").trim();
      document.getElementById("foto").value = base64Puro;

      apagarCamara();
    } else {
      limpiarFoto();
    }
  }

  // Función interna para limpiar estados de captura
  function limpiarFoto() {
    const contexto = canvas.getContext("2d");
    contexto.fillStyle = "#AAA"; 
    contexto.fillRect(0, 0, canvas.width, canvas.height); 

    const fotoFinal = canvas.toDataURL("image/png");
    const preview = document.getElementById("fotoPreview");
    if (preview) preview.setAttribute("src", fotoFinal);
    document.getElementById("foto").value = "";
    apagarCamara();
  }

  // 4. ENVÍO UNIFICADO A FIRESTORE
  if (formularioAgregar) {
    formularioAgregar.addEventListener("submit", (e) => {
      e.preventDefault();

      const platilloNuevo = {
        nombre: document.getElementById('title').value,       
        ingredientes: document.getElementById('ingredients').value, 
        precio: document.getElementById('price').value,
        foto: document.getElementById('foto').value.trim() || ""
      };

      db.collection("platillos").add(platilloNuevo)
        .then(() => {
          M.toast({ html: '¡Platillo agregado con éxito!' });
          formularioAgregar.reset();
          
          document.getElementById('foto').value = "";
          const preview = document.getElementById('fotoPreview');
          if (preview) preview.setAttribute("src", "");

          const elementoForm = document.getElementById('side-form'); 
          const instanciaForm = M.Sidenav.getInstance(elementoForm);
          if (instanciaForm) {
            instanciaForm.close();
          }
        })
        .catch((error) => {
          console.error("Error al subir a Firebase: ", error);
          M.toast({ html: 'Error al conectar con Firebase' });
        });
    });
  }
});

// =========================================================================
// 5. FUNCIONES DE RENDERIZADO VISUAL EN TIEMPO REAL
// =========================================================================
function mostrarPlatillo(platillo, id) {
  const contenedor = document.querySelector(".recipes"); 
  if (!contenedor) return;

  if (contenedor.querySelector(`[data-id="${id}"]`)) return;

  if (!platillo.nombre && !platillo.precio) return;

  let fotoPlatillo;

  if (platillo.foto && platillo.foto.trim() !== "") {
    fotoPlatillo = `data:image/png;base64,${platillo.foto.trim()}`;
  } else {
    fotoPlatillo = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60"; 
  }

  contenido = `
  <div class="card-panel recipe white row" id="${id}" data-id="${id}">
    <img src="${fotoPlatillo}" height="100px" width="100px" style="object-fit: cover; border-radius: 8px; float: left; margin-right: 15px;">
    <div class="recipe-details">
        <div class="recipe-title" style="font-weight: bold; font-size: 1.2rem;">
          ${platillo.nombre}
        </div>
        <div class="recipe-ingredients" style="color: #757575;">
          ${platillo.ingredientes}
        </div>
        <div class="recipe-price" style="font-weight: bold; color: #2e7d32; font-size: 1.1rem;">
          $${platillo.precio} MXN
        </div>
    </div>
    <div class="recipe-delete" style="float: right; cursor: pointer;">
        <i class="material-icons" data-id="${id}">delete_outline</i>
    </div>
  </div>
  `;

  contenedor.innerHTML += contenido;
}

function actualizarPlatillo(platillo, id) {
  let tarjeta = document.getElementById(`${id}`);
  if (tarjeta) {
    tarjeta.querySelector(".recipe-title").innerHTML = platillo.nombre;
    tarjeta.querySelector(".recipe-ingredients").innerHTML = platillo.ingredientes;
    tarjeta.querySelector(".recipe-price").innerHTML = platillo.precio;
  }
}

const borrarPlatillo = (id) => {
  const platillo = document.querySelector(`.recipe[data-id="${id}"]`);
  if (platillo) {
    platillo.remove();
  }
};
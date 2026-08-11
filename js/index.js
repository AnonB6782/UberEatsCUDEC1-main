// Variable global para renderizar el HTML dinámicamente
let contenido = "";

// UN SOLO DOMCONTENTLOADED PARA EVITAR ENVIOS DUPLICADOS O DOCUMENTOS SEPARADOS
document.addEventListener('DOMContentLoaded', function() {
  
  // 1. INICIALIZAR INSTANCIAS SIDENAV DE MATERIALIZE
  const sideMenuElem = document.getElementById('side-menu');
  const sideFormElem = document.getElementById('side-form');

  let instanceMenu = null;
  let instanceForm = null;

  if (sideMenuElem && typeof M !== 'undefined') {
    instanceMenu = M.Sidenav.init(sideMenuElem, { edge: 'right' });
  }

  if (sideFormElem && typeof M !== 'undefined') {
    instanceForm = M.Sidenav.init(sideFormElem, { edge: 'left' });
  }

  // Listener manual de respaldo para asegurar la apertura
  document.querySelectorAll('.sidenav-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-target');

      if (targetId === 'side-menu' && instanceMenu) {
        instanceMenu.open();
      } else if (targetId === 'side-form' && instanceForm) {
        if (instanceMenu) instanceMenu.close();
        instanceForm.open();
      }
    });
  });

  // 2. VARIABLES DE CONTROL DE LA CÁMARA
  let streaming = false;
  const width = 320;
  let height = 0;
  let camaraStream = null;

  // Enlaces a elementos HTML por ID
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const bntFoto = document.getElementById('btnFoto');
  const btnCapturar = document.getElementById('btnCapturar');
  const formularioAgregar = document.querySelector(".add-recipe") || document.querySelector("form"); 

  // 3. LÓGICA PARA ENCENDER LA CÁMARA TRASERA
  if (bntFoto) {
    bntFoto.addEventListener("click", function() {
      // ---> NUEVO: Mostrar cuadro de video y ocultar foto previa <---
      const contenedorCamara = document.getElementById('camara');
      const preview = document.getElementById('fotoPreview');
      if (contenedorCamara) contenedorCamara.style.display = 'block';
      if (preview) preview.style.display = 'none';

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: "environment"
              }
            },
            audio: false
        })
        .then((stream) => {
            camaraStream = stream;
            if (video) {
              video.srcObject = stream;
              video.play();
            }
        })
        .catch((error) => {
            console.error("Error al acceder a la cámara: ", error);
            M.toast({ html: 'No se pudo acceder a la cámara', classes: 'rounded red' });
        });
      }
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

  // Capturar foto al oprimir el botón
  if (btnCapturar) {
    btnCapturar.addEventListener("click", (e) => {
      e.preventDefault();
      tomarFoto();
    });
  }

  // FUNCIÓN PARA APAGAR LA CÁMARA COMPLETAMENTE
  function apagarCamara() {
    if (camaraStream) {
      camaraStream.getTracks().forEach(track => track.stop());
      camaraStream = null;
    }
    if (video) {
      video.srcObject = null;
    }
    streaming = false;

    // ---> NUEVO: Ocultar el recuadro negro (video) de la cámara <---
    const contenedorCamara = document.getElementById('camara');
    if (contenedorCamara) {
      contenedorCamara.style.display = 'none';
    }
  }

  // Procesar la imagen a Base64
  function tomarFoto() {
    if (!canvas || !video) return;
    const contexto = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      contexto.drawImage(video, 0, 0, width, height);
      const fotoCompleta = canvas.toDataURL("image/png");
      
      const preview = document.getElementById("fotoPreview");
      if (preview) {
        preview.setAttribute("src", fotoCompleta);
        // ---> NUEVO: Mostrar la foto capturada <---
        preview.style.display = 'block'; 
      }
      
      const base64Puro = fotoCompleta.replace("data:image/png;base64,", "").trim();
      const inputFoto = document.getElementById("foto");
      if (inputFoto) inputFoto.value = base64Puro;

      apagarCamara(); // Esto ahora ocultará el cuadro negro automáticamente
    } else {
      limpiarFoto();
    }
  }

  // Limpiar estados de captura
  function limpiarFoto() {
    if (!canvas) return;
    const contexto = canvas.getContext("2d");
    contexto.fillStyle = "#AAA"; 
    contexto.fillRect(0, 0, canvas.width, canvas.height); 

    const fotoFinal = canvas.toDataURL("image/png");
    const preview = document.getElementById("fotoPreview");
    if (preview) {
      preview.setAttribute("src", fotoFinal);
      preview.style.display = 'block';
    }
    
    const inputFoto = document.getElementById("foto");
    if (inputFoto) inputFoto.value = "";
    
    apagarCamara();
  }

  // 4. ENVÍO ÚNICO A FIRESTORE
  if (formularioAgregar) {
    formularioAgregar.addEventListener("submit", (e) => {
      e.preventDefault();

      const inputTitle = document.getElementById('title');
      const inputIngredients = document.getElementById('ingredients');
      const inputPrice = document.getElementById('price');
      const inputFoto = document.getElementById('foto');

      const platilloNuevo = {
        nombre: inputTitle ? inputTitle.value.trim() : "",       
        ingredientes: inputIngredients ? inputIngredients.value.trim() : "", 
        precio: inputPrice ? parseFloat(inputPrice.value) || 0 : 0,
        foto: inputFoto ? inputFoto.value.trim() : ""
      };

      if (typeof db !== 'undefined') {
        db.collection("platillos").add(platilloNuevo)
          .then(() => {
            M.toast({ html: '¡Platillo agregado con éxito!', classes: 'rounded green' });
            formularioAgregar.reset();
            
            if (inputFoto) inputFoto.value = "";
            const preview = document.getElementById('fotoPreview');
            if (preview) {
              preview.setAttribute("src", "");
              // ---> NUEVO: Ocultar la foto tras guardar el platillo exitosamente <---
              preview.style.display = 'none'; 
            }

            const elementoForm = document.getElementById('side-form'); 
            if (elementoForm && typeof M !== 'undefined') {
              const instanciaForm = M.Sidenav.getInstance(elementoForm);
              if (instanciaForm) instanciaForm.close();
            }
          })
          .catch((error) => {
            console.error("Error al subir a Firebase: ", error);
            M.toast({ html: 'Error al conectar con Firebase', classes: 'rounded red' });
          });
      }
    });
  }
});

// =========================================================================
// 5. FUNCIONES DE RENDERIZADO VISUAL EN TIEMPO REAL
// =========================================================================
function mostrarPlatillo(platillo, id) {
  const contenedor = document.querySelector(".recipes"); 
  if (!contenedor) return;

  // Prevenir tarjetas duplicadas en el DOM
  if (contenedor.querySelector(`[data-id="${id}"]`)) return;

  // Filtrar documentos vacíos de Firestore
  if (!platillo.nombre && !platillo.precio) return;

  let fotoPlatillo;

  // Detectar si la foto es Base64 o una URL estándar
  if (platillo.foto && platillo.foto.trim() !== "") {
    if (platillo.foto.startsWith("http") || platillo.foto.startsWith("img/")) {
      fotoPlatillo = platillo.foto;
    } else {
      fotoPlatillo = `data:image/png;base64,${platillo.foto.trim()}`;
    }
  } else {
    fotoPlatillo = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60"; 
  }

  contenido = `
  <div class="card-panel recipe white row" id="${id}" data-id="${id}">
    <img src="${fotoPlatillo}" height="100px" width="100px" style="object-fit: cover; border-radius: 8px; float: left; margin-right: 15px;" alt="Platillo">
    <div class="recipe-details">
        <div class="recipe-title" style="font-weight: bold; font-size: 1.2rem;">
          ${platillo.nombre || 'Sin título'}
        </div>
        <div class="recipe-ingredients" style="color: #757575;">
          ${platillo.ingredientes || 'Sin ingredientes'}
        </div>
        <div class="recipe-price" style="font-weight: bold; color: #2e7d32; font-size: 1.1rem;">
          $${platillo.precio || 0} MXN
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
    const elemTitle = tarjeta.querySelector(".recipe-title");
    const elemIngr = tarjeta.querySelector(".recipe-ingredients");
    const elemPrice = tarjeta.querySelector(".recipe-price");

    if (elemTitle) elemTitle.innerHTML = platillo.nombre;
    if (elemIngr) elemIngr.innerHTML = platillo.ingredientes;
    if (elemPrice) elemPrice.innerHTML = `$${platillo.precio} MXN`;
  }
}

function borrarPlatillo(id) {
  const platillo = document.querySelector(`.recipe[data-id="${id}"]`);
  if (platillo) {
    platillo.remove();
  }
}
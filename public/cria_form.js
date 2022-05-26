let acumulador = 0
document.querySelector('.plus-icon').addEventListener('click', (e) => {
  acumulador++
  let input = `<form class="d-flex flex-wrap " id="grupo_${acumulador}" js-data="${acumulador}" style="border-bottom: grey 1px solid; margin:50px auto;">
  
    <div class="form-group  col-sm-3">
    <label for="nome">Nome Do Campo</label>
    <input type="text" class="form-control" required name="name" id="name" placeholder="Nome visível no formulário">
  </div>
    <div class="form-group col-sm-3">
      <label for="field">Tipo de Campo</label>
      <select required class="form-control" name="field" id="field">
        <option></option>
        <option value="input">Input</option>
        <option value="select" >Select Box</option>
        <option value="textarea">Área de Texto</option>
      </select>
    </div>
    <div 
    id="dados_campo_${acumulador}" 
    style="display: contents;"
    ></div>
    <button class="btn btn-danger" id="del_grupo_${acumulador}" 
    style="position: absolute;
    place-self: flex-start;
    margin: -45px auto;
    border-radius: 50%;
   ">✖</button>
  </form>

  `
  document.querySelector('.campos-form').insertAdjacentHTML('beforeend', input)
  document.getElementById(`del_grupo_${acumulador}`).addEventListener('click',event=>{
    console.log(event.target.parentNode.remove())
    event.target.remove()
   

  })
  document.querySelector(`#grupo_${acumulador} #field`).addEventListener('change', (e) => {
    let required = `<div class="form-group col-sm-3">
    <label>Obrigatorio</label>
  
    <div class="form-check">
        <label class="form-check-label">
            <input type="radio" required class="form-check-input" name="required" id="required" value="true" checked>
            Sim
        </label>
    </div>
    <div class="form-check">
        <label class="form-check-label">
            <input type="radio" required class="form-check-input" name="required" id="required" value="false" checked>
            Não
        </label>
    </div>
</div>
<div class="form-group col-sm-3">
    <label>Permitir Edições Futuras</label>
    <div class="form-check">
        <label class="form-check-label">
            <input type="radio" required class="form-check-input" name="editable" id="editable" value="true" checked>
            Sim
        </label>
    </div>
    <div class="form-check">
        <label class="form-check-label">
            <input type="radio" required class="form-check-input" name="editable" id="editable" value="false" checked>
            Não
        </label>
    </div>
</div>`


    if (e.target.value == 'select') {
      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).innerHTML = ''
      let input = `
            <div class="form-group col-sm-5
            ">
              <label for="option">Opções Disponiveis (1 opção por linha)</label>
              <textarea 
                  required
                  class="form-control"
                  name="option"
                  id="option" 
                  rows="5"></textarea>
            </div>
          `
      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).insertAdjacentHTML('beforeend', required + input)
    } else if (e.target.value == 'input') {

      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).innerHTML = ''
      let input = `
            <div class="form-group col-sm-3">
            <label for="type">Tipo de Input</label>
            <select class="form-control" required name="type" id="type">
            <option></option>
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="date">Data</option>
            <option value="time">Hora</option>
            <option value="datetime-local">Data:Hora</option>
            </select>
            </div>
          `
      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).insertAdjacentHTML('beforeend', required + input)

    } else if (e.target.value == 'textarea') {

      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).innerHTML = ''
      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).insertAdjacentHTML('beforeend', required)

    } else {
      document.getElementById(`dados_campo_${e.target.parentNode.parentNode.getAttribute("js-data")}`).innerHTML = ''
    }
  })
})


document.getElementById('enviar').addEventListener('click', (e) => {
  e.preventDefault()
  let grupo_form = [document.getElementById('nome_form').value]
  let formularios = document.getElementsByTagName('form')
  Array.from(formularios).forEach(param => {
    if (param.checkValidity()) {
      let formData = new FormData(param)
      let object = {};
      formData.forEach((value, key) => {
        if (!Reflect.has(object, key)) {
          object[key] = value;
          return;
        }
        if (!Array.isArray(object[key])) {
          object[key] = [object[key]];
        }
        object[key].push(value);
      });
      grupo_form.push(object)
    }
  })
  console.log(grupo_form)
  if (grupo_form.length - 1 == formularios.length && grupo_form.length > 1 && document.getElementById('nome_form').value) {
    postDados('criar_form', grupo_form).then(data=> {
      location.reload(true)
    }).catch(data=>alert("Erro"))
    

  } else {
    alert("Revise os dados do Formulario antes de enviar")
  }
})


let postDados = async (url, dado) => {
  try {
    let request = await axios.post(url, dado)
    alert("Sucesso:" + request.data)
    return request
  } catch (err) {
    alert("Erro ao Registrar " + err)
    return false
  }
}
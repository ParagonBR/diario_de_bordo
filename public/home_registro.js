let btnEditar = document.getElementsByClassName('edit-me')
let btnDel = document.getElementsByClassName('delete-me')
let formulario = document.getElementById('formulario')
let jsonForm


formulario.addEventListener('submit', (e) => {
    e.preventDefault()
    let form = new FormData(e.target)
    form.append('id_form', document.getElementById('form').value)
    postDados('criar_item', form).then(res => {
        if (res != false) {
            e.target.reset()
        }
    })
})


let postDados = async (url, dado) => {
    try {
        let request = await axios.post(url, dado)
        alert("Sucesso:" + request.data)
        return request

    } catch (err) {
        alert("Algo Errado: " + err)
        throw err
    }
}

document.getElementById('form').addEventListener('change', (e) => {
    document.getElementById('nome_form').innerHTML = ''
    document.getElementById('form_dinamico').innerHTML = ''

    if(e.target.value){
        document.getElementById('tabela').innerHTML = ''
        axios.post("formulario", {
            id: e.target.value
        }).then((res) => {
            jsonForm = res.data.formulario
            document.getElementById('form_dinamico').innerHTML = criarForm(res.data.formulario)
            document.getElementById('nome_form').innerHTML = res.data.nome_form
        }).catch((err) =>alert(err))
    }

})


let criarForm = (form) => {
    form = JSON.parse(form)
    let camposForm = form.map((param) => {
        if (param.name) {
            let div = document.createElement('div')
            div.setAttribute('class', "form-group col-sm-6")
            let input = document.createElement(param.field)
            input.setAttribute("name", param.name)
            input.setAttribute("type", param.type)
            if (param.required == "true") {
                input.setAttribute("required", param.required)
            }
            if (param.field == 'select') {
                let options = param.option.map(opt => `<option>${opt}</option>`).join("\n")
                input.insertAdjacentHTML('beforeend', "<option></option>" + options)
            }
            if (param.editable) {
                input.setAttribute('editable', param.editable)

            }
            input.setAttribute("class", 'form-control')
            let label = document.createElement('label')
            label.innerHTML = param.name.toUpperCase()
            div.appendChild(label)
            div.appendChild(input)
            return div.outerHTML
        }
    }).join("<br>")
    return camposForm
}

document.getElementById('gera_form').addEventListener('click', async (event) => {
    document.getElementById('container-registros').style.display = 'none'
    document.getElementById('container-formulario').style.display = 'block'
})


document.getElementById('gera_tabela').addEventListener('click', async (event) => {
    await axios.post('/gera_tabela', {
        id: document.getElementById('form').value
    }).then((response) => {
        document.getElementById('container-registros').style.display = 'block'
        document.getElementById('container-formulario').style.display = 'none'
        document.getElementById('tabela').innerHTML = ''
        if (response.data.length) {
            let table = document.createElement('table')
            table.className = 'table table-responsive table-bordered table-hover'
            table.setAttribute('id', 'tabela_registro')
            let thead = document.createElement('thead')
            thead.className = 'thead-dark'
            let tbody = document.createElement('tbody')
            let th = Object.keys(JSON.parse(response.data[0].detalhe)).map(param => {
                return `<th>${param.toUpperCase()}</th>`
            }).join("\n")
            thead.insertAdjacentHTML('beforeend', th)
            table.insertAdjacentHTML('beforeend', thead.outerHTML)
            document.getElementById('tabela').insertAdjacentHTML('beforeend', table.outerHTML)
            response.data.forEach((param) => {
                let tr = document.createElement('tr')
                tr.setAttribute('data-js', 'linha')
                tr.setAttribute('value', param.id)
                let td = Object.entries(JSON.parse(param.detalhe)).map(row => {
                    if (row[1].length > 50) {
                        return `<td class="text-nowrap table-light" 
                        style="overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 200px;" name="${row[0]}">${row[1]}</td>`
                    }
                    var dateReg = /^\d{4}([-])\d{2}\1\d{2}$/
                    if (row[1].match(dateReg)) {
                        row[1] = ((new Date(row[1].trim())).toLocaleDateString('pt-BR', {
                            timeZone: 'UTC'
                        }))
                    }
                    return `<td class="text-nowrap table-light" name="${row[0]}">${row[1]}</td>`
                }).join("\n")
                tr.insertAdjacentHTML('beforeend', td)
                tbody.insertAdjacentHTML('beforeend', tr.outerHTML)
            })
            document.getElementById('tabela_registro').insertAdjacentHTML('beforeend', tbody.outerHTML)
            jQuery("#tabela_registro").DataTable({
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'excel', 'pdf'
                ],
                "language": {
                    "url": "https://raw.githubusercontent.com/DataTables/Plugins/master/i18n/pt-BR.json"
                }
            })
        } else {
            alert("Não há registros")
        }

    }).catch((error) => {
        alert("Ocorreu um erro ao montar a Tabela")
        console.log(error)
    })
})


document.addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() == 'td') {
        axios.post('/get_registros', {
            id: event.target.parentElement.getAttribute('value')
        }).then(data => {
            data.data.forEach(param => {
                let obj = JSON.parse(param.detalhe)
                console.log(obj)
                Object.entries(obj).forEach(param => {
                    if (document.querySelector(`.jconfirm-content [name=${param[0]}]`)) {
                        document.querySelector(`.jconfirm-content [name=${param[0]}]`).value = param[1]
                        if (document.querySelector(`.jconfirm-content [name=${param[0]}]`).getAttribute('editable')){
                            document.querySelector(`.jconfirm-content [name=${param[0]}]`).setAttribute('disabled','true')
                        }

                    }
                })
            })
        })
        jQuery.confirm({
            title: 'Detalhes',
            content: criarForm(jsonForm),
            icon: 'fa fa-question',
            theme: 'modern',
            closeIcon: true,
            animation: 'scale',
            type: 'blue',
            columnClass: 'col-md-10',
            buttons: {
                // OK: function () {
                //     alert("Beleza")
                // },
                Fechar: function () {
                    // alert("Fechado")
                }
            }
        });

        // console.log(JSON.parse(jsonForm))
        console.log(document.getElementById('jconfirm-content'))

    }
})
const router = require("./server").app
const multer = require('multer');
const axios = require('axios')
const validator = require('express-validator');
const upload = multer();
const jwt = require('jsonwebtoken');
const pool = require('./server').pool
const pool24 = require('./server').pool24




let checkToken = (req, res, next) => {
  if (req._parsedUrl.pathname === '/token') {
    next()
  } else {
    console.log(req._parsedUrl.pathname)
    if (req.session.user) {
      jwt.verify(req.session.user.token, process.env.SECRET, function (err, decoded) {
        if (err) {
          req.session.destroy()          
          return res.status(401).json({
            title: 'Falha na Autenticação',
            error: err
          });
          
        }
        console.log("passou")
        console.log(decoded)
        next();
      })
    } else if(req.query.token) {
      jwt.verify(req.query.token, process.env.SECRET, async function (err, decoded) {
        if (err) {
          return res.status(401).json({
            title: 'Falha na Autenticação',
            error: err
          });
        }
        console.log(decoded)
        
        req.session.user = {
          username: decoded.id,
          token: req.query.token
        }

          let conn24 = await pool24.getConnection()
          let resposta = await conn24.query("select nome from tb_base_funcionarios where cpf = ?", [req.session.user.username])
          await conn24.end();
          console.log(resposta[0])
          if (resposta[0]){
            req.session.user.nome = resposta[0].nome
            res.locals.user = req.session.user
            next();
          }
        else{
          req.session.destroy(()=>{
            res.render('404',{erro: "Nome de usuario não encontrado na base de funcionários"})
          })          

        }
      })
    }
    else {
      res.render('404',{erro: "Token de Autenticação Inválido ou Expirado, favor retornar ao SOSY para revalidar acesso"})
      throw ('Token de Autenticação Inválido ou Expirado, favor retornar ao sosy para revalidar acesso')
    }
  }
};

router.use(checkToken)

router.post("/login", upload.any(), (req, res, next) => {
  console.log(req.body)
  let user = JSON.stringify(req.body.username)
  if (user.length > 5) {
    console.trace(user)
    req.session.user = JSON.parse(user)
    req.session.save(() => {
      res.redirect("/registro")
      console.log("Sessão Criada:" + JSON.stringify(req.session.user))
    })
  } else {
    res.json(req.body)
  }

})

router.get('/', async (req, res, next) => {
  res.redirect('/registro')
})

// Renderiza o modelo do formulario 

router.post("/formulario", validator.check('id').isNumeric(), async (req, res, next) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    })
  } else {
    const conn = await pool.getConnection()
    let resposta = await conn.query("select nome_form,formulario from tb_tipo_form where id = ?", [req.body.id])
    await conn.end();
    res.json(resposta[0])
  }
})

// Gera a tabela com os dados escolhidos na pagina formulario

router.post("/gera_tabela", validator.check('id').isNumeric(), async (req, res, next) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    })
  } else {
    const conn = await pool.getConnection()
    let resposta = await conn.query("select id,usuario,detalhe from tb_diario where tipo = ?", [req.body.id])
    await conn.end();
    res.json(resposta)
  }
})

// Renderiza a pagina formulario

router.get("/registro", async (req, res, next) => {
  try {
    const conn = await pool.getConnection()
    let resposta = await conn.query("select id,nome_form from tb_tipo_form")
    await conn.end();
    res.render('formulario', {
      resposta: resposta,
      user:  res.locals.user
    });
  } catch (err) {
    console.log(err)
  }
})


// Insere os registros do formulario escolhido na pagina formulario

router.post("/criar_item", upload.any(), async (req, res, next) => {
  if (!req.body.data) {
    res.status(403)
  }
  console.log(req.socket.remoteAddress)
  dadosFormulario = req.body
  try {
    let conn = await pool.getConnection()
    console.log(dadosFormulario)
    let id_form
    if (dadosFormulario.id_form) {
      id_form = dadosFormulario.id_form
      dadosFormulario.autor = req.session.user.nome 
      delete dadosFormulario.id_form
    }
    let dadosEnvio = [req.session.user.username, id_form, JSON.stringify(dadosFormulario)]
    const resultado = await conn.query(`Insert into tb_diario (usuario,tipo,detalhe) values (?,?,?)`, dadosEnvio);
    console.log(resultado)
    await conn.end();
    res.json("Dados Inseridos com sucesso");

  } catch (err) {
    console.log(err);
    console.log({
      erro: "erro ao registrar, revise seus dados"
    })
    res.status(500).json({
      erro: "erro ao registrar, revise seus dados"
    })
  }
})




// Renderiza a pagina criacao_formulario
router.get("/criar_form", (req, res, next) => {
  res.render('criacao_formulario')
})

router.post("/get_registros", validator.check('id').isNumeric(), async (req, res, next) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    })
  } else {
    const conn = await pool.getConnection()
    let resposta = await conn.query("select id,usuario,detalhe from tb_diario where id = ?", [req.body.id])
    await conn.end();
    res.json(resposta)
  }
})


// Recebe parametros da pagina criação_formulario para inserir o modelo do formulario no banco

router.post("/criar_form", upload.any(), async (req, res, next) => {
  console.log(req.body)
  req.body.forEach(item => {
    if (item.option) {
      item.option = item.option.trim().split('\n').filter(param => param)
    }
    if (item.name) {
      item.name = item.name.split(' ').join('_')
    }
  })
  try {
    let dadosEnvio = [req.body.shift(), req.session.user.username,JSON.stringify(req.body)]
    let conn = await pool.getConnection()
    const resultado = await conn.query(`Insert into tb_tipo_form (nome_form,criador,formulario) values (?,?,?)`, dadosEnvio);
    console.log(resultado)
    await conn.end();
    res.json("Dados Inseridos com sucesso");
  } catch (err) {
    console.trace(err.code);
    if(err.code == 'ER_DUP_ENTRY'){
      res.json("Nome do Formulario ja existe no banco de dados");
      return
    }
  
      res.json("Erro ao registrar:" + err)
  
  }
  console.log(req.body)
})


router.post('/token', (req, res, next) => {
  console.log(req.body.username)
  if (req.body.username) {
    //auth ok
    const id = req.body.username; //esse id viria do banco de dados
    const token = jwt.sign({
      id
    }, process.env.SECRET, {
      expiresIn: 18000 // expira em 50min
    });
    console.log(jwt.verify(token, process.env.SECRET))
    return res.json({
      auth: true,
      token: token
    });
  }

  res.status(500).json({
    message: 'Login inválido!'
  });
})


router.get('*', (req, res) =>{
   res.render('404',{erro: "Página Não Encontrada"});
})
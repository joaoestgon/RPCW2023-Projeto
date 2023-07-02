var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');

var path = require('path');
var fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: 'uploads' });
const sZip = require('node-stream-zip');
const { createHash } = require('crypto');
var jwt = require('jsonwebtoken');
const AdmZip = require('adm-zip');

var env = require('../config/env')

/* Verify Token Function */
function verifyToken(req, res, next) {
    var myToken = req.cookies.token;
    jwt.verify(myToken, 'RPCW2023', function (e, payload) {
        if (e) {
            res.status(450).jsonp({ error: 'Token verification error: ' + e })
        }
        else {
            next()
        }
    })
}

/* Logger Function */
function logger(username, action){
    var log = {}
  
    log.user = username;
    log.date = new Date().toISOString().substring(0,16).split('T').join(' ');
    log.action = action
  
    axios.post(env.logAccessPoint + "/logs", log)
      .then(values => console.log("Log added."))
      .catch(error => {console.log("Log error: " + error)})
}

// função para verificar se os ficheiros descritos no manifesto existem
function exists(a, b) {
    for (i = 0; i < b.length; i++) {
        if (b[i].includes(a)) return i;
    }
    return -1;
}

function hash(string) {
    return createHash('sha256').update(string).digest('hex');
}

function sleep(time) {
    return new Promise((resp) => { setTimeout(resp, time) });
}

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            // files_.push(name)
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}


/* --- Resources --- */

/*UPLOAD File */
router.post("/upload", verifyToken, upload.single('myFile'), function (req, res, next) {
    manifest = 0
    information = 0
    manifValid = 1
    infoValid = 1
    fileList = []
    metadata = {}
    manifInfo = {}
    warnings = []

    if (req.cookies.level === 'producer' || req.cookies.level === 'admin')
        if (req.file.mimetype == "application/zip" || req.file.mimetype == "application/x-zip-compressed") {
            console.log("ZIP File found!!!")

            const zip = new sZip({
                file: req.file.path,
                storeEntries: true
            })

            zip.on('ready', () => {

                for (const entry of Object.values(zip.entries())) {
                    fileList.push(entry.name)
                }

            // Verificar se o manifesto existe e se os ficheiros mencionados no mesmo existem
                if ((index = exists('RRD-SIP.json', fileList)) != -1) {
                    manifest = 1
                    data = zip.entryDataSync(fileList[index]).toString("utf8")
                    manifInfo = JSON.parse(data)

                    manifInfo.data.forEach(f => {
                        extension = f.path.split('.')[1]
                        hashed_path = hash(f.path)
                        if (hashed_path == f.checksum) {
                            if ((index = exists(f.path, fileList)) == -1) {
                                manifest = 0
                                manifValid = 0
                                console.log("File " + f.path + " doesn't exist!")
                                warnings.push("File " + f.path + " doesn't exist!")
                            }
                        }
                        else {
                            warnings.push("Checksum does not have the correct value!")
                        }
                    })
                    if (manifest == 1)
                        console.log("Manifest approved")
                }
                else {
                    manifest = 0
                }
            // Fim da verificação da existencia dos ficheiros

            //  Verificar se os metadados existem e estão corretamente preenchidos
                if ((index = exists("metadata.json", fileList)) != -1) {
                    information = 1
                    data = zip.entryDataSync(fileList[index]).toString("utf8")
                    infoInfo = JSON.parse(data)
                    if (!(infoInfo.hasOwnProperty('title') && 
                            infoInfo.hasOwnProperty('dateCreated') && 
                            infoInfo.hasOwnProperty('type') && 
                            infoInfo.hasOwnProperty('authors'))) {
                        information = 0
                        infoValid = 0
                        console.log("Missing Metadata Information")
                    }
                    else {
                        metadata.authors = infoInfo.authors
                        metadata.dateCreated = infoInfo.dateCreated
                        metadata.title = infoInfo.title
                        var types = ['Exam', 'Compiler', 'Program', 'Worksheet', 'Slides']
                        if (!(types.includes(infoInfo.type))) {
                            information = 0
                            warnings.push("Invalid Resource Type!")
                        }
                        else metadata.type = infoInfo.type

                        console.log("Metadata approved")
                    }
                    if (!(infoInfo.hasOwnProperty('description'))) {
                        metadata.description = ""
                        warnings.push("Description field is empty!")
                    }
                    else {
                        metadata.description = infoInfo.description
                    }
                }
                else {
                    information = 0
                }

                if (manifest == 1 && information == 1) {
                    // Para já fica o que está nos metadados mas posteriormente adicionamos
                    // a data em que fizer efetivamente upload e 
                    // metadata.dataSubmissao = infoInfo.dataSubmissao
                    var decoded = jwt.decode(req.cookies.token, { complete: true })
                    var username = decoded.payload.username
                    metadata.submissionDate = new Date().toISOString().substring(0, 16).split('T').join(' ')
                    metadata.idProducer = username
                    console.log('Sumissor: ' + username)
                    console.log("ZIP Approved")
                    zip.close()
                    next()
                }
                else {
                    if (manifest != 1) warnings.push("Verify if the ZIP has the manifest file (RRD-SIP.json)!");
                    if (information != 1) warnings.push("Verify if the ZIP has the metadata file (metadata.json)!");
                    if (manifValid != 1) warnings.push("Verify if the information in the manifest file is correct!");
                    if (infoValid != 1) warnings.push("Verify if the information in the metadata file is correct!");

                    var pdir = path.normalize(__dirname + "/..")
                    let qpath = pdir + "/" + req.file.path
                    try {
                        fs.unlinkSync(qpath)
                    } catch (err) {
                        console.log("Error at upload 1: " + err);
                    }

                    res.render('warnings', { warnings: warnings })
                }
            });
        }
        else {
            var pdir = path.normalize(__dirname + "/..")
            let qpath = pdir + "/" + req.file.path
            try {
                fs.unlinkSync(qpath)
            } catch (err) {
                console.log("Error at upload 2: " + err);
            }

            var warning = ["File must be a ZIP!"]
            // Novamente render de uma pagina com os types e os avisos
            res.render('warnings', { warnings: warning })
        }
    else
        res.render("warnings", { warnings: ["Required Access Level: Admin or Producer!"] })
}, function (req, res) {

    const zip = new sZip({
        file: req.file.path,
        storeEntries: true
    })

    // Caso o ZIP seja válido, vem do next em cima
    var pdir = path.normalize(__dirname + "/..")
    let qpath = pdir + "/" + req.file.path
    let tname = hash(metadata.title + metadata.dateCreated)
    let tname1 = tname.substring(0, tname.length / 2)
    let tname2 = tname.substring(tname.length / 2 + 1, tname.length)
    let npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
    if (!fs.existsSync(npath)) {
        metadata.path = "/public/fileStorage/" + tname1 + "/" + tname2
        axios.post(env.apiAccessPoint + "/resources?token=" + req.cookies.token, metadata)
            .then(values => {
                var rid = values.data._id
                fs.mkdir(npath, { recursive: true }, err => {
                    if (err) console.log("Error on new path creation: " + err)
                    else {
                        zip.extract(null, npath, err => {
                            console.log(err ? "Error extracting: " + err : "Extracted")
                            if (!err) {
                                //Adicionar às notícias
                                var decoded = jwt.decode(req.cookies.token, { complete: true })
                                var username = decoded.payload.username
                                //console.log('metadados para fazer a noticia: ', metadata)
                                var news = {
                                    nome: "System",
                                    title: metadata.type + " Submited",
                                    content: metadata.idProducer + " submited " + metadata.title,
                                    timestamp: new Date().toISOString().slice(0, 16).split('T').join(' '),
                                    visivel: true
                                }
                                axios.post(env.apiAccessPoint + '/news?token=' + req.cookies.token, news)
                                    .then(response => {
                                        action = "uploaded " + metadata.titulo
                                        logger(username, action)

                                        zip.close()
                                        res.redirect("/")
                                    })
                                    .catch(err => {
                                        console.log("Error while sending news to the DB: " + err)
                                        res.render('error', { error: err })
                                    })
                            }
                        })
                    }
                })
            })
            .catch(err => {
                if (err.response.status == 403) {
                    let warning = ['Required Access Level: Admin or Producer!']
                    res.render('warnings', { warnings: warning })
                }
                console.log("Error while sending resource to the BD on first level: " + err)
            })
    }
    else {
        warnings.push("The content you tried to insert already exists!")
        res.render('warnings', { warnings: warnings })
    }
    try {
        fs.unlinkSync(qpath);
    } catch (err) {
        console.log("Error deleting file from the uploads folder:" + err)
    }
    sleep(300)
        .then(() => {
            if (fs.existsSync(npath + "/" + req.file.originalname.split('.')[0]))
                try {
                    fs.unlinkSync(npath + "/" + req.file.originalname.split('.')[0] + "/RRD-SIP.json")
                    fs.unlinkSync(npath + "/" + req.file.originalname.split('.')[0] + "/metadata.json")
                } catch (err) {
                    console.log("Error deleting manifest and metadata files: " + err)
                }
        })

})

/*Listar todos os resources ou só um dos resources*/
router.get('/', verifyToken, (req, res) => {
    var q = url.parse(req.url, true).query

    if (q.id != undefined) {
        //Apresentar a página de um recurso específico
        var rid = q.id
        console.log(rid)
        // console.log('Listar recurso com id ' + rid)
        axios.get(env.apiAccessPoint + '/resources/' + rid + "?token=" + req.cookies.token)
            .then(response => {
                resource = response.data
                // console.log(resource)
                var decoded = jwt.decode(req.cookies.token, { complete: true })

                var filesObj = []
                var pdir = path.normalize(__dirname + "/..")
                let qpath = pdir + "/" + resource.path
                let tname = hash(resource.title + resource.dateCreated)
                let tname1 = tname.substring(0, tname.length / 2)
                let tname2 = tname.substring(tname.length / 2 + 1, tname.length)
                let npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
                var file_path = pdir + resource.path
                if (file_path == npath) {
                    var files = getFiles(file_path, files);
                    //console.log(files)
                    files.forEach(f => {
                        var fSplit = f.split('/')
                        var size = fSplit.length
                        var filename = fSplit[size - 1]
                        filesObj.push({ filePath: f, name: filename })
                    })
                }

                username = decoded.payload.username
                action = "accessed  reource '" + resource.title + "'"
                logger(username, action)
                
                let reviews = resource.reviews
                let score = 0
                let userScore = 0
                if (reviews.length > 0) {
                    console.log(reviews)
                    score = (reviews.reduce((acc, x) => acc + x.value, 0) / reviews.length).toFixed(2)
                    userScore = reviews.find(x => x.idUser == decoded.payload.username).value
                }
                axios.get(env.apiAccessPoint + "/comments/" + rid + "?token=" + req.cookies.token)
                    .then(values => {
                        if (values.data != undefined) comments = values.data
                        else comments = []
                        //console.log(filesObj)
                        res.render('resource', { title: resource.title, user: decoded.payload.username, comments: comments, resource: resource, logged: 'true', level: req.cookies.level, files: filesObj , score: score, userScore: userScore});
                    })
                    .catch(err => {
                        console.log("Error showing resource: " + err);
                        res.render('error', { error: err })
                    })
            })
            .catch(error => {
                res.render('error', { error: error });
            })
    }
    else {
        axios.get(env.apiAccessPoint + '/resources?token=' + req.cookies.token)
            .then(response => {
                resources = response.data
                var baseUrl = req.protocol + '://' + req.get('host')
                res.render('resources', { title: 'resources', resources: resources, url:baseUrl, logged: 'true', level: req.cookies.level });
            })
            .catch(error => {
                res.render('error', { error: error });
            })
    }
});

router.get("/admin", verifyToken, (req, res, next) => {
    var q = url.parse(req.url, true).query
    // console.log(q.type)
    if (req.cookies.level === 'admin')
        if (q.type != undefined) {
            axios.get(env.apiAccessPoint + "/resources?type=" + q.type + "&token=" + req.cookies.token)
                .then(values => {
                    var baseUrl = req.protocol + '://' + req.get('host')
                    res.render('resources', { title: 'Resources', resources: values.data, url:baseUrl, logged: 'true', level: req.cookies.level })
                })
                .catch(erro => {
                    console.log("ADMIN: Error showing by type" + q.type + ": " + erro)
                })
        }
        else {
            // console.log("entrei aqui")
            axios.get(env.apiAccessPoint + '/resources?token=' + req.cookies.token)
                .then(response => {
                    resources = response.data
                    var baseUrl = req.protocol + '://' + req.get('host')
                    res.render('resources', { title: 'Resources', resources: resources, url: baseUrl,  logged: 'true', level: req.cookies.level });
                })
                .catch(error => {
                    res.render('error', { error: error });
                })
        }
    else
        res.render("warnings", { warnings: ["Required Access Level: Admin!"] })
})

/* procurar recurso por titulo */
router.get('/search', (req, res, next) => {
    var q = url.parse(req.url, true).query
    if (q.search != '') {
        axios.get(env.apiAccessPoint + "/resources?search=" + q.search + "&token=" + req.cookies.token)
            .then(values => {
                var decoded = jwt.decode(req.cookies.token, { complete: true })

                username = decoded.payload.username;
                action = "searched for " + "'" + q.search + "'"
                logger(username, action)
                var baseUrl = req.protocol + '://' + req.get('host')
                res.render('resources', {title: q.search, resources: values.data, url: baseUrl, logged: 'true', level: req.cookies.level })
            })
            .catch(erro => {
                console.log("Error searching by regexp: " + erro)
                res.render('error', { error: erro })
            })
    }
    else {
        res.redirect('/')
    }
});

/* procurar recurso por titulo */
router.get("/type", (req, res, next) => {
    var q = url.parse(req.url, true).query
    if (q.type != '') {
        axios.get(env.apiAccessPoint + "/resources?type=" + q.type + "&token=" + req.cookies.token)
            .then(values => {
                var decoded = jwt.decode(req.cookies.token, { complete: true })

                username = decoded.payload.username;
                action = "searched for type '" + q.type + "'"
                logger(username, action)
                var baseUrl = req.protocol + '://' + req.get('host')
                res.render('resources', { resources: values.data, url:baseUrl, logged: 'true', level: req.cookies.level })
            })
            .catch(erro => {
                console.log("Error searching by type: " + erro)
                res.render('error', { error: erro })
            })
    }
    else {
        res.redirect('/')
    }
});

router.post('/review/:id', (req, res, next) => {
    let userReview = req.body.value
    console.log(userReview)
    axios.put(env.apiAccessPoint + '/resources/' + req.params.id + '/review?token=' + req.cookies.token, {review: userReview})
        .then(value => {
            res.send("Review set successfully.")
        })
        .catch(error => {
            res.status(500).send(error.response !== undefined ? error.response.data.error : error)
        })
})

router.get('/delete/:id', (req, res, next) => {
    var id = req.params.id
    if (id != undefined) {
        
    //Remover do fileStorage
    //É preciso um get dos metadados deste recurso
        console.log(id)
        axios.get(env.apiAccessPoint + "/resources/" + id + "?token=" + req.cookies.token)
            .then(response => {
                console.log('getting resource')
                // console.log(response)
                var metadata = response.data
                var folder_path = metadata.path
                var fullpath = path.normalize(__dirname+"/..") + folder_path
                console.log(fullpath)
                // console.log(fullpath.split('/'))
                var folder = ""
                var path_split = fullpath.split("/")
                for (i = 0; i < path_split.length - 1; i++)
                    folder += path_split[i] + "/"
                console.log(folder)
                if (fs.existsSync(folder)) {
                    fs.rmdirSync(folder, { recursive: true });
                    // console.log("Folder deleted successfully");
                } else {
                    console.log("Folder does not exist!")
                }
                axios.delete(env.apiAccessPoint + '/resources/' + id + '?token=' + req.cookies.token)
                    .then(response => {
                        console.log('Recurso eliminado com sucesso')
                        //console.log(metadata)
                        //var path = metadata.path 
                        // console.log(path)
                        var decoded = jwt.decode(req.cookies.token, { complete: true })

                        username = decoded.payload.username;
                        action = "removed the resource " + response.data.title
                        logger(username, action)

                        var news = {
                            author: decoded.payload.username,
                            title: 'Resource Deletion',
                            content: 'deleted a resource',
                            timestamp: new Date().toISOString().slice(0, 16).split('T').join(' '),
                            //idResource: req.params.rid,
                            visible: true
                        }
                        axios.post(env.apiAccessPoint + '/news?token=' + req.cookies.token, news)
                            .then(() => console.log('News added (resource deleted).'))
                            .catch(err => res.render('error', { error: err }))
                        if (req.cookies.level == 'admin')
                            res.redirect('/resources/admin')
                        else
                            res.redirect('/users/profile')
                    })
                    .catch(error => {
                        console.log('Error deleting resource: ' + error)
                        res.render('error', { error: error })
                    })
            })
            .catch(error => {
                console.log('Error getting resource ' + id + ': ' + error)
                res.render('error', { error: error });
            })
    }
});

router.get('/edit/:rid', (req, res, next) => {
    var id = req.params.rid
    if (id != undefined) {
        console.log(id)
        axios.get(env.apiAccessPoint + '/resources/' + id + '?token=' + req.cookies.token)
            .then(data => {
                // console.log(data)
                var type = data.data.type
                var file_title = data.data.title
                res.render('editResource', { title: 'Edit Resource: ' + file_title + ' (' + type + ')', resource: data.data, logged: 'true', level: req.cookies.level })
            })
            .catch(error => {
                console.log('Error on viewing resource with id: ' + id)
                res.render('error', { error: error });
            })
    }
})

router.post('/edit/:rid', verifyToken, (req, res, next) => {
    var updatedResource = req.body
    // console.log(updatedResource)
    axios.put(env.apiAccessPoint + '/resources/' + req.params.rid + '?token=' + req.cookies.token, updatedResource)
        .then(response => {
            // console.log(resposta)
            var decoded = jwt.decode(req.cookies.token, { complete: true })

            username = decoded.payload.username;
            action = "edited the resource '" + updatedResource.titulo + "'"
            logger(username, action)

        // Post News
            var news = {
                author: decoded.payload.username,
                title: 'Resource Edition',
                content: 'edited a resource',
                timestamp: new Date().toISOString().slice(0, 16).split('T').join(' '),
                //idResource: req.params.rid,
                visible: true
            }
            axios.post(env.apiAccessPoint + '/news?token=' + req.cookies.token, news)
                .then(() => console.log('News added (reource edit).'))
                .catch(err => res.render('error', { error: err }))
            if (req.cookies.level == 'admin')
                res.redirect('/resources/admin')
            else
                res.redirect('/users/profile')
        })
        .catch(error => {
            console.log('Error editing ' + error)
            res.render('error', { error: error })
        })
})

router.get("/download/:rid", (req, res, next) => {
    axios.get(env.apiAccessPoint + "/resources/" + req.params.rid + "?token=" + req.cookies.token)
        .then(values => {
            var resource = values.data
        // Metadados
            var metadata = {}
            metadata.submissionDate = resource.submissionDate
            metadata.dateCreated = resource.dateCreated
            metadata.idProducer = resource.idProducer
            metadata.authors = resource.authors
            metadata.title = resource.title
            metadata.type = resource.type
            metadata.description = resource.description
        // RRD
            var rrd = {}
            rrd.version = "1.0"
            rrd.encoding = "UTF-8"
            rrd.algorithm = "sha256"
            rrd.data = []

        // Fazer pasta temporária de download, calcular o hash a partir daí
            var pdir = path.normalize(__dirname + "/..")
            var path = pdir + resource.path
            var tname = hash(metadata.titulo + metadata.dataCriacao)
            let tname1 = tname.substring(0, tname.length / 2)
            let tname2 = tname.substring(tname.length / 2 + 1, tname.length)
            var npath = pdir + "/public/fileStorage/" + tname1 + "/" + tname2
            var temppath = pdir + "/public/fileStorage/temp"
            // console.log("path na BD: " + path)
            // console.log("path calculado:" + npath)
            var files = []
            if (npath == path) {
                files = getFiles(path, files);
                files.forEach(f => {
                    //console.log(f)
                    let path_file = f.split(tname2)[1]
                    let paths_split = path_file.split('/')
                    let checksum_info = {}
                    let path_checksum = ""
                    for (i = 2; i < paths_split.length; i++) {
                        if (i == 2) path_checksum += paths_split[i]
                        else path_checksum += "/" + paths_split[i]
                    }
                    checksum_info.checksum = hash(path_checksum)
                    checksum_info.path = path_checksum
                    rrd.data.push(checksum_info)
                })
            // No fim de ter a pasta temporária criada temos de criar o ficheiro de metadados com a metadata
            // e criar o manifesto RRD-SIP com os checksums calculados a partir da pasta data
                let metadata_json_info = JSON.stringify(metadata, null, 4)
            //Para cada ficheiro dentro da pasta data, calcular o checksum e guardar no json RRD-SIP
                let manifest_json_info = JSON.stringify(rrd, null, 4)
                let complete_path = files[0].split(tname2)[1].split("data")[0]
                //console.log(complete_path)
                let json_split = complete_path.split('/')
                // console.log(json_split)
                let path_json = ""
                for (i = 1; i < json_split.length - 1; i++) path_json += "/" + json_split[i]
                // console.log("path para guardar o json: " + temppath+path_json)
            // Depois tenho de fazer o zip disto tudo
                path_json = temppath + path_json
                console.log(path_json)
                if (!fs.existsSync(path_json)) {
                    fs.mkdir(path_json, { recursive: true }, err => {
                        if (err) console.log("Error creating temp folder: " + err)
                        else {
                            fs.writeFile(path_json + "/RRD-SIP.json", manifest_json_info, err => { if (err) console.log(err) })
                            fs.writeFile(path_json + "/metadata.json", metadata_json_info, err => { if (err) console.log(err) })
                        }
                    })
                } else {
                    console.log("Temp path for Json files does not exist yet")
                }
                sleep(300)
                    .then(() => {
                        try {
                            const zipper = new AdmZip();
                            var outputFile = path_json + ".zip";
                            zipper.addLocalFolder(npath + complete_path);
                            zipper.addLocalFile(path_json + "/RRD-SIP.json");
                            zipper.addLocalFile(path_json + "/metadata.json");
                            zipper.writeZip(outputFile);
                            console.log(`Created ${outputFile} successfully`);
                        } catch (e) {
                            console.log(`Something went wrong. ${e}`);
                        }
                    })
                //     // console.log("Cheguei aqui")
                sleep(500)
                    .then(() => {
                        res.download(path_json + ".zip", err => {
                            if (err) {
                                console.log("Error downloading file: " + err)
                                // res.redirect("/")
                            } else {
                                if (fs.existsSync(temppath)) {
                                    fs.rmSync(temppath, { recursive: true });
                                } else {
                                    console.log("Folder to be deleted doesn't exist")
                                }
                                console.log("Download successful")
                                var decoded = jwt.decode(req.cookies.token, { complete: true })
                                
                                username = decoded.payload.username;
                                action = "downloaded the resource '" + files[0].split(tname2)[1].split('/')[files[0].split(tname2)[1].split('/').length - 1]+ "'"
                                logger(username, action)
                                // console.log("Entrei aqui")
                            }
                        })
                    })
            }
            // res.redirect("/")
        })
        .catch(error => {
            console.log("Error downloading file: " + error);
            res.render('error', { error: error })
        })
});

/* --- Comments --- */

router.post("/comment/:rid", verifyToken, (req, res, next) => {
    var q = url.parse(req.url, true).query
    // console.log(q)
    if (q.user != undefined) {
        comment = {
            idUser: q.user,
            idResource: req.params.rid,
            date: new Date().toISOString().substring(0, 16).split('T').join(' '),
            text: req.body.textarea
        }
        axios.post(env.apiAccessPoint + "/comments?token=" + req.cookies.token, comment)
            .then(resp => {
                console.log("Comment added")
                axios.get(env.apiAccessPoint + "/resources/" + req.params.rid + "?token=" + req.cookies.token)
                    .then(values => {
                    //Criar  log para o comentário
                        var decoded = jwt.decode(req.cookies.token, { complete: true })
                        // console.log(resposta)

                        username = decoded.payload.username;
                        action = "commented on the resource '" + values.data.title + "'"
                        logger(username, action)

                        res.redirect("/resources?id=" + req.params.rid)
                    })
                    .catch(err => {
                        console.log("Error fetching resource: " + err)
                    })
            })
            .catch(err => {
                console.log("Error inserting comment: " + err)
            })
    } else {
        console.log("COMMENT ERROR: User unidentified!")
    }
})

router.get("/comment/delete/:rid", verifyToken, (req, res, next) => {
    var q = url.parse(req.url, true).query
    if (q.user != undefined){
        console.log(req.params.rid)
        axios.delete(env.apiAccessPoint + "/comments/" + req.params.rid + "?token=" + req.cookies.token + "&user=" + q.user)
            .then(resp => {
                axios.get(env.apiAccessPoint + "/resources/" + resp.data.idResource + "?token=" + req.cookies.token)
                    .then(values => {
                        //console.log(values)
                        console.log("delete commemnt1")
                        var decoded = jwt.decode(req.cookies.token, { complete: true })

                        username = decoded.payload.username;
                        action = "deleted a comment on the resource '" + values.data.title + "'"
                        logger(username, action)

                        res.redirect("/resources?id=" + resp.data.idResource)
                    })
                    .catch(err => {
                        console.log("Error fetching resource: " + err)
                    })
            })
            .catch(err => {
                console.log("Error deleting comment")
                res.render('error', { error: err })
            })
        } else {
        console.log("Action Denied")
        res.render('warnings', { warnings: ["Insuficient permissions to access this page."] })
    }
})

module.exports = router;
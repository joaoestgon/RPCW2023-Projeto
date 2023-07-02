module.exports.apiAccessPoint = 'http://localhost:42069'
module.exports.authAccessPoint= 'http://localhost:42269'
module.exports.logAccessPoint= 'http://localhost:42369'

// --- Tentativa Docker ---
//module.exports.apiAccessPoint=`http://${process.env.API_PORT_42069_TCP_ADDR}:${process.env.API_PORT_42069_TCP_PORT}`
//module.exports.authAccessPoint=`http://${process.env.AUTH_PORT_42269_TCP_ADDR}:${process.env.AUTH_PORT_42269_TCP_PORT}`
//module.exports.logAccessPoint=`http://${process.env.LOG_PORT_42369_TCP_ADDR}:${process.env.LOG_PORT_42369_TCP_PORT}`
const qrcode = require('qrcode-terminal');
const pg = require("pg");
const { Client, LocalAuth} = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});
 

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
    enviarMensaje()
});


const clientDb2 = new pg.Client({
    user: "postgres",
    host: "database-1.c2r6xchxt3al.us-east-1.rds.amazonaws.com",
    database: "postgres",
    password: "agustin123",
    port: 5432,
  });
  
clientDb2.connect();


const enviarMensaje = async () => {

    const setHJora = "SET TIME ZONE 'America/Argentina/Buenos_Aires'";
    await clientDb2.query(setHJora);
    
    // quiero saber la hora del servidor en horario argentino
    const customQueryHora = "select to_char(now(), 'HH24:MI:SS') as hora";
    const responseHora = await clientDb2.query(customQueryHora);
    const hora = responseHora.rows[0].hora;

  console.log(hora)

     if (hora >= "08:00:00" && hora <= "12:00:00") {
      console.log("Msj cumple")

      // Primero obtengo lo cumpleañeros
      const customQuery =
        "select name, phone_number from client c where to_char(now(), 'MM-DD') =  to_char(c.birth_date, 'MM-DD')";
      const responseCumpleaneros = await clientDb2.query(customQuery);
    
      // Si existen cumpleañeros me traigo los mensajes de cumpleaños
      if (responseCumpleaneros.rows.length > 0) {
        const customQuery2 = "select mensaje from mensaje where tipo_mensaje_id=1";
        const responseMensajes = await clientDb2.query(customQuery2);
    
        // Por cada cumpleañero envio el mensaje
        
        enviarMensajeAClientes(responseCumpleaneros.rows, responseMensajes.rows);
      }
    
      // Ahora hago lo mismo con los clientes que se les cumple x cantidad de dias que faltan
      const customQueryAusente ="select name, phone_number from client where to_char((now() - fecha_ultimo_corte ), 'DD')::INT = (select frecuencia from mensaje where tipo_mensaje_id = 2 limit 1)";
      const responseAusente = await clientDb2.query(customQueryAusente);
    
      if(responseAusente.rows.length > 0){
        const customQuery3 = "select mensaje from mensaje where tipo_mensaje_id=2";
        const responseMensajesAusente = await clientDb2.query(customQuery3);
        enviarMensajeAClientes(responseAusente.rows, responseMensajesAusente.rows);
    };



  } else {

   // 
   console.log("Msj bienvenida")

     const customQueryBienvenida ="select phone_number from client where saludo_bienvenida = false";
      const responseBienvenida = await clientDb2.query(customQueryBienvenida);
      if(responseBienvenida.rows.length > 0){

      const customQuery4 = "select mensaje from mensaje where tipo_mensaje_id=3";
      const responseMensajesBienvenida = await clientDb2.query(customQuery4);
      enviarMensajeAClientes(responseBienvenida.rows, responseMensajesBienvenida.rows);
      }
    
  }

    function enviarMensajeAClientes(listaClientes, mensajes){
        let tiempoAnterior = 0;
        let contador = 0;
        listaClientes.forEach((cliente) => {
          //elijo un mensaje de cumpleaños al azar
          const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)].mensaje;
          // elijo un numero entre 20 y 60 para que no se envien todos los mensajes al mismo tiempo
          const tiempo = Math.floor(Math.random() * (60 - 20) + 20) * 1000;
          contador === 0 ? tiempoAnterior = tiempo : tiempoAnterior = tiempoAnterior + tiempo;
          console.log("el tiempo elegido fue: ", tiempo)
          // envio el mensaje
          setTimeout(async () => {
      
            console.log("el numero es: ", cliente.phone_number)
            console.log(!isNaN(cliente.phone_number))

            if(!isNaN(cliente.phone_number)){
                client.sendMessage("549" + cliente.phone_number + "@c.us", mensaje);
            }
            
          }, tiempoAnterior);
          contador++;
        });
    }
  }



client.initialize();
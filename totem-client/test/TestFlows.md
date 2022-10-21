# TESTS

## C1 - New Tag
  
### C1.1 - Completado OK [DONE]
A. Se procesa todo OK y se muestra mensaje al final.
  
NOTA:
 - Hacer que cuando se seleccione el tipo de document se posicione el cursor en la caja de valor del doc.

### C1.2 - Falla en proceso CVU [PENDING]
A. Si falla al arrancar el procesamiento,
 - si el servidor retorna error, se muestra mensaje de error y se ofrece reintentar o cancelar
 - si hay un error en la comunicación, se muestra mensaje de error y se ofrece reintentar o cancelar
B. Si falla al verificar el resultado,
 - si el servidor retorna error, se muestra mensaje de error y se ofrece reintentar o cancelar
 - si hay un error en la comunicación, se muestra mensaje de error y se ofrece reintentar o cancelar
 - si la respuesta de status es erronea, se muestra mensaje de error y se va al home (se asume que si se reintenta se obtiene el mismo error por lo que no se ofrece reintentar)
 - si no se obtiene un status de error o de OK en 10 intentos, se muestra mensaje de error y se ofrece reintentar o cancelar
  
### C1.3 - Falla en pago [PENDING]
A. Si falla al arrancar el pago,
 - Si hay un error de comunicación, se muestra error y se ofrece reintentar. 
   - Si cancela, se inicia proceso de rollback en CVU
 - Si el servidor retorna error, se muestra error y se ofrece reintentar. 
   - Si cancela, se inicia proceso de rollback en CVU
B. Si falla al verificar el resultado
 - Si hay un error de comunicación, se muestra error y se ofrece reintentar. 
   - Si cancela, se inicia proceso de rollback en CVU
 - Si el servidor retorna error, se muestra error y se ofrece reintentar. 
   - Si cancela, se inicia proceso de rollback en CVU
 - Si el servidor retorna un status con error, se muestra error y se ofrece reintentar. 
   - Si cancela, se inicia proceso de rollback en CVU
  
NOTAS:
 - Falta manejo de error por timeout para que reintente solo sin avisar al usuario (controlar cuantas veces reintenta solo)
 - Falta manejo de maxima cantidad de intentos de statusCheck para el pago
  
### C1.4 - Falla en tag [PENDING]
A. Si falla la impresión del TAG
 - Si windows retorna error en la impresión, se muestra mensaje de error y se ofrece reintetar.
   - Si cancela, se pasa a la página de Refund.
B. Si falla el reporte de impresión del TAG al servidor
 - Si el servidor retorna error, se muestra mensaje de error y se ofrece reintentar.
   - Si cancela, se pasa a la página de Refund.
 - Si hay un problema de comunicación con el servidor, se muestra mensaje de error y se ofrece reintentar.
   - Si cancela, se pasa a la página de Refund.
C. Si falla la verificación del TAG
 - Si el servidor retorna error, se muestra mensaje de error y se ofrece reintentar.
   - Si reintenta, se espera a que el usuario vuelva a escanear el TAG.
   - Si cancela, se pasa a la página de Refund
 - Si falla la comunicación con el servidor, se muestra mensaje de error y se ofrece reintentar.
   - Si reintenta, se espera a que el usuario vuelva a escanear el TAG.
   - Si cancela, se pasa a la página de Refund
 - Si el servidor retorna que el TAG no esta libre, se muestra mensaje de error y se espera nueva lectura
   + No se esta expidiendo otro tag para poder probar con otro
   - Si cancela, se pasa a la página de Refund
  
 NOTAS:
  - No tiene boton para cancelar manualmente en la pantalla
  - Si el servidor retorna que el TAG no es valido (no esta FREE), no se expende otro TAG para reintentar
  
### C1.5 - Falla en confirmación de transacción [PENDING]
A. Si falla la confirmación de transacción
   - Si falla la comunicación con el servidor, se muestra mensaje de error y se ofrece reintentar.
     - Si cancela, se pasa a la página de Refund.
   - Si el servidor retorna error, se muestra mensaje de error y se ofrece reintentar.
     - Si cancela, se pasa a la página de Refund.
   - Si el servidor retorna status diferente a 'COMPLETED', se muestra mensaje de error y se pasa a la pagina de Refund
  
## C2 - Recharge
  
### C2.1 - Completado OK [DONE]
A. Se procesa todo OK y se muestra mensaje al final.

NOTAS: 
 - No se reciben confirmaciones por mail ni SMS
  
### C2.2 - Falla en proceso de CVU [DONE]
A. Si falla al arrancar el procesamiento, 
 - por error del servidor, da error con opción de reintentar
 - por error de comunicación, da error con opción de reintentar
 - por timeout, reintenta solo (hasta 2 veces más)
B. Si falla al verificar el resultado del procesamiento
 - por falla de comunicación, da error y cancela al home
 - por error de servidor, da error y cancela al home
 - por error en el resultado, da error y cancela al home
  
### C2.3 - Falla en pago [DONE]
A. Si falla al arrancar la solicitud de pago, 
 - se muestra mensaje de error al usuario con la opcion de reintentar o cancelar la operación.
   - en caso de reintentar se vuelve a enviar el comienzo de pago a Sarea.
   - En caso de cancelar se cancela la recarga en CVU
B. Si falla al verificar el resultado de pago,
 - si la transaccion da como resultado un error, se muestra error con opción de reintantar el pago
   - Si cancela, se cancela la recarga en CVU
 - si el servidor retorna error, se muestra mensaje de error con opción de reintentar el pago
   - Si cancela, se cancela la recarga en CVU
 - si da timeout el servidor, se reintenta automatico
 - si da error de comunicación, se muestra mensaje de error con opción de reintentar el pago
   - Si cancela, se cancela la recarga en CVU
  
NOTAS:
 - En caso de recibir un error al verificar el pago, se muestra mensaje con opcion re-intento.
   Al reintentar, puede generar un 2do pago porque el 1ro salio bien y no pudimos verlo.
   O si cancela, no se cancela el pago porque no sabemos si salio bien.
  
### C2.4 - Refund OK [DONE]
A. Se hace refund en CVU y se muestra el mensaje de confirmación al usuario.
  
### C2.5 - Falla en refund [DONE]
A. Si falla el pedido de refund en CVU,
 - respuesta erronea del servidor, o comunicacion, se sigue para la reversa del pago sin avisar al usuario y se deberia mandar alarma

B. Si falla el pedido de refund en Sarea
 - respuesta erronea del servidor, se muestra mensaje de error y se pasa a pagina de soporte
 - si falla el pedido al servidor por timeout, se reintenta hasta 2 veces mas y da error y se pasa a pagina de soporte
 - si falla por error de comunicación, se muestra mensaje de error y se pasa a pagina de soporte

### C2.6 - Falla en confirmación [DONE]
A. Si falla la confirmación de recarga en CVU
  - por respuesta erronea del servidor, se muestra mensaje de error con opción de reintentar 
    - si cancela, se inicia proceso de cancelación de recarga y de pago
  - por error de comunicación, se muestra mensaje de error con opción de reintentar 
    - si cancela, se inicia proceso de cancelación de recarga y de pago
  - si el servidor retorna un status diferente a COMPLETED, se muestra mensaje de error con opción de reintentar 
    - si cancela, se inicia proceso de cancelación de recarga y de pago

**Start | New**
----
  Chequea que exista el usuario y la matrícula y retorna que acción tomar. <br>


* **URL**  
  `POST` /cvu/start/new
  
*  **URL Params**  
  None

* **Data Params**  
  `userDocType=[int]` 2 <br />
  `userDocValue=[string]` "32722703" <br />
  `userVehiclePlateNumber=[string]` "GBA1298" <br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```json
    {
      "operation" : "NEW_CLIENT" | "ADD_VEHICLE" | "ASSIGN_TAG",
      "userName"  : "Elon Musk",
      "userEmail" : "elon@musk.com",
      "userCel"   : "099944201",
      "error"     : null,
      "tagValue"  : 250.00
    }
    ```
* **Error Response:**
  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "operation": null,
      "error": "Descripcion amable para cliente"
    }
    ```

* **Sample Call:**
```sh
curl 'http://192.168.1.160:12345/cvu/start/new' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Referer: http://localhost:3000/' \
  -H 'authorization: ABC' \
  -H 'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data-raw '{"userDocType":2,"userDocValue":"32722703","userVehiclePlateNumber":"GBA1298"}' \
  --compressed
```


**Start | Recharge**
----
  Chequea que exista el usuario y retorna sus datos. <br>

  1. Busca el usuario en CVU usando el metodo `<server>/CcoWsConCue/CcoWsConCue.asmx?op=ConsultarCuenta`.
  2. Da de alta el usuario en la tabla `user` si no existe y se guarda sus datos (incluido el `externalId`)
  3. Retorna los datos obtenidos de CVU.<br>

  X1. En caso de no existir dar error 404

* **URL**  
  `POST` /cvu/start/recharge
  
*  **URL Params**  
  None

* **Data Params**  
  `userDocType=[int]` 2 <br />
  `userDocValue=[string]` "32722703" <br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```json
    {
      "userId"   : 1,
      "userName" : "Elon Musk",
      "userCel"  : "099944201",
      "userEmail": "elon@musk.com"
    }
    ```
* **Error Response:**
  * **Code:** 404 <br />
    **Content:** None<br />

* **Sample Call:**
```bash
curl 'http://192.168.1.160:12345/cvu/start/recharge' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Referer: http://localhost:3000/' \
  -H 'authorization: ABC' \
  -H 'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data-raw '{"userDocType":2,"userDocValue":"32722703"}' \
  --compressed
```

**Check Payment**
----
  Verifica el estado de un pago.<br>

* **URL**  
  `POST` /sarea/checkPayment

*  **URL Params**  
  None

* **Data Params**  
  `customerId=[int]` 53 <br />
  `paymentId=[int]` 47 <br />
  `transactionId=[int]` 53 <br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "amount"        : "50000.00"
      "amountDiscount": "0.00"
      "id"            : 47
      "status"        : "PAYING"
      "transaction"   : {
        "id"       : 53,
        "type"     : "BUY",
        "status"   : "PAYING",
        "userId"   : 53,
        "errorCode": null,
        "errorDesc": "ESPERANDO CAPTURA"
      }
      "errorCode": null
      "errorDesc": "ESPERANDO CAPTURA"
      "id"       : 53
      "status"   : "PAYING"
      "type"     : "BUY"
      "userId"   : 53
    }
    ```
 
* **Error Response:**


* **Sample Call:**

  ```javascript
    
  ```


**Execute Start**
----
  Solicita el procesamiento de una transacción.<br>

* **URL**  
  `POST` /cvu/executeStart

* **URL Params**  
  None

* **Data Params**  
  `vehicle.brand=[string]` Tesla <br />
  `vehicle.model=[string]` S <br />
  `vehicle.color=[string]` White <br />
  `vehicle.plateNumber=[string]` GBA1234 <br />
  `transactionId=[int]` 123 <br />
  `clientNumber=[int]` 90<br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "id"       : 123,
      "type"     : 1,
      "status"   : "PAID",
      "userId"   : 3,
      "errorCode": 0,
      "errorDesc": "OK",
      "payments"  : [{
        "id"            : 321,
        "amount"        : 500.00,
        "amountDiscount": 0.00,
        "status"        : "PAID",
      }]
    }
    ```
 
* **Error Response:**


* **Sample Call:**

  ```bash
    
  ```



**Execute Status**
----
  Verifica el estado del procesamiento de una transacción.<br>

* **URL**  
  `POST` /cvu/executeStatus

*  **URL Params**  
  None

* **Data Params**  
  `transactionId=[int]` 123 <br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "id"       : 123,
      "type"     : 1,
      "status"   : "PAYING",
      "userId"   : transaction.userId,
      "errorCode": transaction.errorCode,
      "errorDesc": transaction.errorDesc,
      "payment"  : [{
        "id"            : payment.id,
        "amount"        : payment.amount,
        "amountDiscount": payment.amountDiscount,
        "status"        : payment.status
      }]
    }
    ```
 
* **Error Response:**


* **Sample Call:**

  ```bash
    
  ```



**Check TAG**
----
  Verifica el estado del TAG<br>

* **URL**  
  `GET` /cvu/checkTag/{tagid}

*  **URL Params**  
  `tagid=[string]` E280110C2000704935C10991 <br />

* **Data Params**  
  None <br />

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "tagId"    : "E280110C2000704935C10991",
      "createdOn": 2020-08-02 14:33:00,
      "status"   : "FREE"
    }
    ```
 
* **Error Response:**
  * **Code:** 404 <br />
    No se encuentra el tag <br />
    **Content:** None <br />

* **Sample Call:**

  ```bash
  curl 'http://192.168.1.160:12345/cvu/checkTag/E280110C2000704935C10991' \
    -H 'Accept: application/json, text/plain, */*' \
    -H 'Referer: http://localhost:3000/' \
    -H 'authorization: ABC' \
    -H 'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36' \
    -H 'Content-Type: application/json;charset=UTF-8' \
    --data-raw '{"userDocType":2,"userDocValue":"32722703"}' \
    --compressed
  ```



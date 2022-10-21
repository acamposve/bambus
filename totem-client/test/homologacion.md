
# CASO 1 - Nuevo cliente - Tag erroneo
Doc: 2|88888816
Mat: AYY0000
Tag: E280110C2000758AF5F309FX

# CASO 2 - Nuevo Cliente - Falla de pago
Doc: 2|88888816
Mat: AYY0000
Tag: E280110C2000788EC5A7099C

# CASO 3 - Nuevo Cliente - OK
Doc: 2|88888816
Mat: AYY0000
Tag: E280110C2000788EC5A7099C

# CASO 4 - Nuevo cliente - OK
Doc: 2|88888822
Mat: AYY0002
Tag 1: E280110C20007B0EC5A7099C
Tag 2: [enviar uno distinto]

# CASO 5 - Nuevo cliente - OK
Doc: 3|E88888822
Mat: AYY0003
Tag: E280110C20007A4EC5A7099C

# CASO 6 - Nuevo cliente - Tag invalido
Doc: 3|E88888823
Mat: AYY0004
Tag: E280110C20007A4EC5A7099C

# CASO 7 - Nuevo vehiculo - OK
Doc: 3|E88888822
Mat: AYY0004
Tag: E280110C2000790EC5A7099C

# CASO 8 - Error en obtener operacion (matricula ya asociada)
Doc: 3|E88888822
Mat: AYY0004

# CASO 9 - Nuevo TAG - OK
Doc: 3|E88888822
Mat: AYY0005
Tag: E280110C20007ACEC5A7099C

# CASO 10 - Nuevo TAG - Falla de pago
Doc: 2|88888816
Mat: AYY0000
Tag: E280110C200078CEC5A7099C

# CASO 11 - Error al obtener operacion (CI invalida)
Doc: 2|88888817
Mat: AYY0002
Tag: E280110C200078CEC5A7099C

# CASO 12 - Error al obtener operacion (Matricula invalida)
Doc: 2|88888822
Mat: 
  
  
CASOS QUE FALTARIAN:

 - Solo recarga de cuenta (sin enviar el cliInsPrep)


window.credentials = process.env.TOTEM_TOKEN;
window.totem       = process.env.HOSTNAME;
window.API_URL     = process.env.API_URL
window.IS_DEBUG    = process.env.IS_DEBUG == "true";
window.DEBUG_DATA  = window.IS_DEBUG
  ? {
      userDocType: 2,
      userDocValue: "99999983",
      vehiclePlateNumber: "ZZZ0001",
      userName: "Elon Musk",
      userCel: "099944201",
      userEmail: "hello@bambus.tech",
      vehicleBrand: {
        id: 306,
        name: "Tesla",
      },
      vehicleModel: {
        id: 2780,
        name: "S3",
      },
      vehicleColor: {
        id: 16,
        name: "Blanco",
      },
    }
  : undefined;

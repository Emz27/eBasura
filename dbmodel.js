
const batches = {
    batchId: "",
    pickupLocations: []
}

const collection = {
    address: "Socorro, Cubao, Quezon City, Metro Manila",
    comment: "",
    dateTime: "November 20, 2018 at 12:00:00 AM UTC+8",
    location: "[14.61881° N, 121.057171° E]",
    pickupId: "A1B1",
    pickupDocId: "/pickup locations/9Si8P1N2YutaM46NWTa5",
    status: "pending",
    truckId:"",
    truckDocId: "",
    collectors: [],
}

const user = {
    userId: "",
    password: "",
    truck:{
      truckDocId:"",
      truckId:"",
    },
    type: "",
}

const pickupLocation = {
    pickupId: "",
    address: "",
    comment: "",
    batch: {},
    location: {
        latitude:"",
        longitude: "",
    },
    route:{
        
    }
}

const truck = {
    truckId:"",
    location: {
      latitude:"",
      longitude: "",
    },
    route: {

    },
    collectors:[{}],
    batch:{},
}




export default {
  batches,
  collection,
  user,
  truck,
  pickupLocation
};
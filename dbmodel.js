
const batches = {
    batchId: [],
    pickupLocations: [],
    createdBy: "",
    truckId: "",
    collectors: ""
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
    truckId: "",
    type: "",
}

const pickupLocation = {
    pickupId: "",
    address: "",
    comment: "",
    location: {
        latitude:"",
        longitude: "",
    },
    route:{
        
    }
}

const truck = {
    truckId:"",
    collectors:[],
    location: {
        latitude:"",
        longitude: "",
    },
    route: {

    }
}




export default {
    baches,
    collection,
    user,
    truck,
    pickupLocation
};
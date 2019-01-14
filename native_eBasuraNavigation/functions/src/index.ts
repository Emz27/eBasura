
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);

exports.sendPushNotification = functions.firestore
  .document("Notifications/{notifId}")
  .onCreate( async (event )=>{

    const data = event.data();
    const payload = {
      notification: {
        title: data.title,
        body: event.data().body,
        sound: "default",
      }
    }
    const subscribers = await admin.firestore().collection("Users").where("pickupDocId","==", data.pickupDocId).get();
    let sucess = 0;
    let fail = 0;
    for( const user of subscribers.docs){
      if(user.data().pushToken){
        try{
          await admin.messaging().sendToDevice(user.data().pushToken, payload);
          sucess++;

        }
        catch(e){
          fail++;
        }
      }
    }
    await admin.firestore().collection("Notifications").doc(event.id).update({
      sucess,
      fail,
    })
  });
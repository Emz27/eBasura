import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import * as firebase from 'firebase';
import 'firebase/firestore';


export default class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    try{
      this._bootstrapAsync();
    }
    catch(error){
      console.log(error);
    }
  }


  // Fetch the token from storage then navigate to our appropriate place
  loadData = async (userData)=>{
    this.user = { key: userData.docs[0].id, ...userData.docs[0].data() };
    await AsyncStorage.setItem('eBasuraNavigationUser', JSON.stringify(this.user));
  

    let trucks = await firebase.firestore().collection('trucks').where('truckid','==', userData.docs[0].data().truckid).get();
    if(trucks.docs.length){
      this.truck = { key: trucks.docs[0].id ,...trucks.docs[0].data()}

      await AsyncStorage.setItem('eBasuraNavigationTruck',JSON.stringify(this.truck));
      //let pickupLocationDocs = await firebase.firestore().collection('pickup locations').get();
      let pickupLocationDocs = await firebase.firestore().collection('trucks').doc(trucks.docs[0].id).collection('pickup locations').get();

      
      if(pickupLocationDocs.docs.length){
        this.pickupLocations = pickupLocationDocs.docs.map((doc)=>{
          return { key: doc.id ,...doc.data()};
        })
        console.log(JSON.stringify(this.pickupLocations));
        await AsyncStorage.setItem('eBasuraNavigationPickupLocations', JSON.stringify(this.pickupLocations));
      }
    }
  }
  _bootstrapAsync = async () => {

    const { navigate } = this.props.navigation;
    const userToken = await AsyncStorage.getItem('eBasuraNavigationUser');
    if (!userToken) return navigate('SignIn');

    let token = JSON.parse(userToken);
    console.log('auth')
    console.log(token.userid)
    let userData = await firebase.firestore().collection('users').where('userid','==',token.userid).get();

    if ( userData.docs.length ){
      await this.loadData(userData);
      return navigate('Main',JSON.stringify({
        'eBasuraNavigationUser':this.user,
        'eBasuraNavigationPickupLocations': this.pickupLocations,
        'eBasuraNavigationTruck': this.truck
      }));
    } 
    else {
      await AsyncStorage.removeItem('eBasuraNavigationUser');
      return navigate('SignIn');
    }
  };

  // Render any loading content that you like here
  render() {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
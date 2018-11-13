import React from 'react';
import { Button, TouchableWithoutFeedback, Text, View, AsyncStorage, FlatList, StyleSheet, Animated, Dimensions } from 'react-native'
import { ExpoConfigView } from '@expo/samples';

import * as firebase from 'firebase';
import 'firebase/firestore';

let { width: windowX } = Dimensions.get('window')

export default class PickupLocationsScreen extends React.Component {
  constructor(props){
    super(props);
    this.loadPickupLocations();
    this.loadUser();
    this.state = {
      user:{},
      pickuplocations:[],
    }
    
  }
  static navigationOptions = {
    title: 'Pickup Locations',
  };
  onPressSignOut = async () =>{
    await AsyncStorage.removeItem('eBasuraNavigationUser');
    this.props.navigation.navigate('AuthLoading');
  }
  componentDidMount(){

  }
  loadPickupLocations = async ()=>{
    var pickupLocations = JSON.parse(await AsyncStorage.getItem('eBasuraNavigationPickupLocations'))
    pickupLocations = pickupLocations.map((pickup)=>{
      pickup.itemWidthMax = 0;
      pickup.itemWidthMin = (-1)*windowX*.8;

      pickup.isLarge = false;
      pickup.itemWidth = new Animated.Value( pickup.itemWidthMin );
      pickup.itemHeight = new Animated.Value( pickup.itemHeightMin );

      return pickup;
    });
    this.setState({
      pickuplocations: pickupLocations
    })

    console.log('Pickup Locations Loaded');
  }
  loadUser = async ()=>{
    this.setState({
      user: JSON.parse(await AsyncStorage.getItem('eBasuraNavigationUser'))
    })
    console.log('User Loaded');
  }
  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return (
      <View style={styles.container}>

      
      <FlatList contentContainerStyle={styles.list}
        data={this.state.pickuplocations}
        renderItem={({item}) => 
            <View>
              <TouchableWithoutFeedback onPress={()=>{
                  console.log("preesss");
                  Animated.parallel(
                    [
                      Animated.spring( item.itemWidth, {toValue: (item.isLarge)?item.itemWidthMin:item.itemWidthMax,}),
                    ],
                    {
                      useNativeDriver: true
                    }
                  ).start();
                  item.isLarge = !item.isLarge;
                }
              }>
              <Animated.View style={[{transform:[{ translateX: item.itemWidth}]}, styles.listItem ]}>

                  <View style={{flex:1}}><Text>{item.address}</Text></View>
                  <View><Text>{item.pickupid}</Text></View>

              </Animated.View>
            </TouchableWithoutFeedback>
            <View style={{position:"absolute",right:0,zIndex:-1000, width:(-1)*windowX*.8,flex:1, flexDirection:"row-reverse"}}>
              <View style={styles.itemButton}></View>
              <View style={styles.itemButton}></View>
              <View style={styles.itemButton}></View>
            </View>
            </View>
            
        }
      />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container:{
    flex:1
  },
  list :{
    flex:1,
    alignItems:"flex-start",
  },
  listItemContainer:{
    padding: 20,
    marginTop:5,
    backgroundColor: "#01ffbf",
    marginHorizontal:"auto",
  },
  listItem:{
    backgroundColor: "#02ffe5",
    padding: 2,
    flexDirection:"row",

    borderBottomEndRadius:5,
    borderTopEndRadius:5,
    marginTop:5,
    elevation: 10,
    width: windowX*.9,
    overflow:"hidden",
    position:"relative",
  },
  itemButton:{
    width:15,
    height:15,
    marginVertical:"auto",
    borderRadius: 15, 
    elevation: 10,
    marginRight: 20, 
    backgroundColor:"#01ffbf"
  }
});
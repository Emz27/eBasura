import React from 'react';
import { TouchableWithoutFeedback, Text, View, AsyncStorage, FlatList, StyleSheet, Animated } from 'react-native'
import { ExpoConfigView } from '@expo/samples';

import * as firebase from 'firebase';
import 'firebase/firestore';

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
      pickup.itemWidthMax = 100;
      pickup.itemWidthMin = 50;
      pickup.itemHeightMax = 80;
      pickup.itemHeightMin = 50;

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
                      Animated.spring(
                        item.itemWidth,
                        {
                          toValue: (item.isLarge)?item.itemWidthMin:item.itemWidthMax,
                          friction: 3,
                          tension: 40
                        }
                      ),
                      Animated.spring(
                        item.itemHeight,
                        {
                          toValue: (item.isLarge)?item.itemHeightMin:item.itemHeightMax,
                          friction: 3,
                          tension: 40
                        }
                      ),
                    ],
                    {
                      useNativeDriver: true
                    }
                  ).start();
                  item.isLarge = !item.isLarge;
                }
              }>
              <Animated.View  
                style={[{width: item.itemWidth, height: item.itemHeight }, styles.listItem ]
                }
                >
                {
                  <Text>{item.pickupid}</Text>
                  /*<Text>{item.address}</Text>*/
                  
                }
              </Animated.View>
            </TouchableWithoutFeedback>
              <View style={
                {
                  height:1000,
                  width: 10,
                  backgroundColor:"black",
                  position:"absolute",
                  top:0,

                }
              }></View>
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
    alignItems:"center",
    padding: 10,
  },
  listItemContainer:{
    padding: 20,
    marginTop:5,
    backgroundColor: "#01ffbf",
    borderRadius:5,
    marginHorizontal:"auto",
  },
  listItem:{
    backgroundColor: "#02ffe5",
    padding: 2,
    borderRadius:5,
    marginTop:5,
    elevation: 10,
    overflow:"hidden"
  }
});
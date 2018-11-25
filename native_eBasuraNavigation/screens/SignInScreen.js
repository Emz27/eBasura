
import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Button,
  StatusBar,
  StyleSheet,
  View,
  TextInput,
  Text,
  PermissionsAndroid ,
  NetInfo,
} from 'react-native';


import firebase from 'react-native-firebase';

NetInfo.getConnectionInfo().then((connectionInfo) => {
  console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
});
function handleFirstConnectivityChange(connectionInfo) {
  console.log('First change, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
  NetInfo.removeEventListener(
    'connectionChange',
    handleFirstConnectivityChange
  );
}
NetInfo.addEventListener(
  'connectionChange',
  handleFirstConnectivityChange
);

export default class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Please sign in',
  };
  constructor(props){
    super(props);
    this.state = {
      userId: '',
      password: '',
      userIdError: '',
      passwordError: '',
    }
  }
  onInputChange = (input)=>{
    this.setState({
      userIdError: '',
      passwordError: '',
      ...input,
    });
  }
  rememberUser = async (userId) =>{
    await AsyncStorage.setItem()
  }
  onSubmit = async ()=>{
    let errorLabel = false;
    if(this.state.userId.length <= 0){
      errorLabel = true;
      this.setState({userIdError: 'This field is required'})
    }
    if(this.state.password.length <= 0){
      errorLabel = true;
      this.setState({passwordError: 'This field is required'})
    }
    if(errorLabel) return false;
    let Users = {}
    console.log("before fetech")
    try{
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.INTERNET,
        {
          'title': 'Cool Photo App Camera Permission',
          'message': 'Cool Photo App needs access to your camera ' +
                     'so you can take awesome pictures.'
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera")
      } else {
        console.log("Camera permission denied")
      }
      Users = await firebase.firestore().collection('Users').where('userId','==',this.state.userId).get();
    }
    catch(e){
      console.log("fail fetch user");
    }
    console.log("userId", this.state.userId);
    console.log("number of results",Users.docs.length)

    if( !Users.docs.length ){
      return this.setState({
        userIdError: 'User doesnt exist'
      })
    }
    else if( Users.docs[0].data().password != this.state.password){
      return this.setState({
        passwordError: 'User ID and Password does not match'
      })
    }
    await AsyncStorage.setItem('user', JSON.stringify({ key: Users.docs[0].id, ...Users.docs[0].data() }) );
    this.props.navigation.navigate('AuthLoading');
  }
  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => this.onInputChange({userId:text})}
          value={this.state.userId}
          placeholder="User ID"
        />
        <Text>{this.state.userIdError}</Text>
        <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => this.onInputChange({password:text})}
          value={this.state.password}
          placeholder="Password"
        />
        <Text>{this.state.passwordError}</Text>
        <Button title="Sign in!" onPress={this.onSubmit} />
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
  userIdTextInput:{

  },
  passwordTextInput:{

  },
  
});
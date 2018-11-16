import {parse, stringify} from 'flatted/esm'
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
} from 'react-native';
import { createStackNavigator, createSwitchNavigator } from 'react-navigation';

import * as firebase from 'firebase';
import 'firebase/firestore';

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
    let error = false;
    if(!this.state.userId){
      error = true;
      this.setState({userIdError: 'This field is required'})
    }
    if(!this.state.password){
      error = true;
      this.setState({passwordError: 'This field is required'})
    }
    if(error) return false;

    let Users = await firebase.firestore().collection('Users').where('userId','==',this.state.userId).get();
    console.log(Users.docs.length)

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